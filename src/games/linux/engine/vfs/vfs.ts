import { fail, ok, type User, type VfsResult } from '../types';
import { basename, dirname, isInside, joinPath, segments } from './path';

export type Mode = number;

export interface NodeMeta {
  /** Hidden when it starts with a dot. */
  name: string;
  owner: string;
  group: string;
  /** Octal permissions, e.g. 0o644. */
  mode: Mode;
  mtime: number;
}

export interface FileNode extends NodeMeta {
  type: 'file';
  content: string;
}

export interface DirNode extends NodeMeta {
  type: 'dir';
  children: Map<string, VfsNode>;
}

export type VfsNode = FileNode | DirNode;

export type SerializedNode =
  | (NodeMeta & { type: 'file'; content: string })
  | (NodeMeta & { type: 'dir'; children: SerializedNode[] });

export type Access = 'r' | 'w' | 'x';

export const FILE_MODE: Mode = 0o644;
export const DIR_MODE: Mode = 0o755;
const ACCESS_BIT: Record<Access, number> = { r: 4, w: 2, x: 1 };

/** Deterministic clock: every call moves one minute forward. */
export function createFakeClock(start = Date.UTC(2026, 8, 1, 8, 0)): () => number {
  let now = start;
  return () => {
    const time = now;
    now += 60_000;
    return time;
  };
}

const encoder = new TextEncoder();

export function nodeSize(node: VfsNode): number {
  return node.type === 'dir' ? 4096 : encoder.encode(node.content).length;
}

export function makeFile(
  name: string,
  content: string,
  meta: Pick<NodeMeta, 'owner' | 'group' | 'mode'>,
  mtime: number,
): FileNode {
  return { type: 'file', name, content, mtime, ...meta };
}

export function makeDir(
  name: string,
  meta: Pick<NodeMeta, 'owner' | 'group' | 'mode'>,
  mtime: number,
): DirNode {
  return { type: 'dir', name, children: new Map(), mtime, ...meta };
}

/**
 * In-memory file system with Unix-like permissions. Paths given to its methods
 * are absolute and normalized (see `resolvePath`). Errors are returned, never thrown.
 */
export class Vfs {
  private constructor(
    private readonly root: DirNode,
    private readonly clock: () => number,
  ) {}

  static empty(clock = createFakeClock()): Vfs {
    return new Vfs(makeDir('', { owner: 'root', group: 'root', mode: DIR_MODE }, clock()), clock);
  }

  static deserialize(data: SerializedNode): Vfs {
    const root = fromSerialized(data);
    if (root.type !== 'dir') throw new Error('The root of a file system must be a directory');
    return new Vfs(root, createFakeClock(maxMtime(root) + 60_000));
  }

  serialize(): SerializedNode {
    return toSerialized(this.root);
  }

  can(node: VfsNode, user: User, access: Access): boolean {
    if (user.name === 'root') {
      return access !== 'x' || node.type === 'dir' || (node.mode & 0o111) !== 0;
    }
    const shift = node.owner === user.name ? 6 : user.groups.includes(node.group) ? 3 : 0;
    return ((node.mode >> shift) & ACCESS_BIT[access]) !== 0;
  }

  /** Node at a path, without permission checks. For UI and goal checks. */
  stat(path: string): VfsNode | null {
    let node: VfsNode = this.root;
    for (const part of segments(path)) {
      if (node.type !== 'dir') return null;
      const next = node.children.get(part);
      if (!next) return null;
      node = next;
    }
    return node;
  }

  /** Walks the path like the kernel does: every folder on the way needs x. */
  lookup(path: string, user: User): VfsResult<VfsNode> {
    let node: VfsNode = this.root;
    for (const part of segments(path)) {
      if (node.type !== 'dir') return fail('not_a_directory');
      if (!this.can(node, user, 'x')) return fail('permission_denied');
      const next = node.children.get(part);
      if (!next) return fail('not_found');
      node = next;
    }
    return ok(node);
  }

  listDir(path: string, user: User): VfsResult<VfsNode[]> {
    const found = this.lookup(path, user);
    if (!found.ok) return fail(found.error);
    const dir = found.value;
    if (dir.type !== 'dir') return fail('not_a_directory');
    if (!this.can(dir, user, 'r')) return fail('permission_denied');
    return ok([...dir.children.values()]);
  }

  readFile(path: string, user: User): VfsResult<string> {
    const found = this.lookup(path, user);
    if (!found.ok) return fail(found.error);
    const node = found.value;
    if (node.type === 'dir') return fail('is_a_directory');
    if (!this.can(node, user, 'r')) return fail('permission_denied');
    return ok(node.content);
  }

  /** Creates the file if needed. */
  writeFile(
    path: string,
    data: string,
    user: User,
    append = false,
  ): VfsResult<{ created: boolean }> {
    const found = this.lookup(path, user);
    if (found.ok) {
      const node = found.value;
      if (node.type === 'dir') return fail('is_a_directory');
      if (!this.can(node, user, 'w')) return fail('permission_denied');
      node.content = append ? node.content + data : data;
      node.mtime = this.clock();
      return ok({ created: false });
    }
    if (found.error !== 'not_found') return fail(found.error);
    const parent = this.writableParent(path, user);
    if (!parent.ok) return fail(parent.error);
    parent.value.children.set(basename(path), this.newFile(basename(path), data, user));
    return ok({ created: true });
  }

  touch(path: string, user: User): VfsResult<{ created: boolean }> {
    const found = this.lookup(path, user);
    if (!found.ok) {
      return found.error === 'not_found' ? this.writeFile(path, '', user) : fail(found.error);
    }
    const node = found.value;
    if (!this.can(node, user, 'w') && node.owner !== user.name) return fail('permission_denied');
    node.mtime = this.clock();
    return ok({ created: false });
  }

  /** Returns the folders that were created. */
  mkdir(path: string, user: User, parents = false): VfsResult<string[]> {
    if (!parents) {
      const found = this.lookup(path, user);
      if (found.ok) return fail('already_exists');
      if (found.error !== 'not_found') return fail(found.error);
      const parent = this.writableParent(path, user);
      if (!parent.ok) return fail(parent.error);
      parent.value.children.set(basename(path), this.newDir(basename(path), user));
      return ok([path]);
    }
    const created: string[] = [];
    const parts = segments(path);
    let current = '/';
    for (const [index, part] of parts.entries()) {
      current = joinPath(current, part);
      const found = this.lookup(current, user);
      if (found.ok) {
        if (found.value.type !== 'dir') {
          return fail(index === parts.length - 1 ? 'already_exists' : 'not_a_directory');
        }
        continue;
      }
      if (found.error !== 'not_found') return fail(found.error);
      const made = this.mkdir(current, user);
      if (!made.ok) return made;
      created.push(current);
    }
    return ok(created);
  }

  remove(path: string, user: User, recursive = false): VfsResult<void> {
    if (path === '/') return fail('operation_not_permitted');
    const found = this.lookup(path, user);
    if (!found.ok) return fail(found.error);
    const node = found.value;
    if (node.type === 'dir' && !recursive) return fail('is_a_directory');
    const parent = this.writableParent(path, user);
    if (!parent.ok) return fail(parent.error);
    if (node.type === 'dir') {
      const removable = this.checkRemovable(node, user);
      if (!removable.ok) return removable;
    }
    parent.value.children.delete(basename(path));
    return ok(undefined);
  }

  /** Copies `src` to exactly `dest`. The caller decides if `dest` is "inside a folder". */
  copy(src: string, dest: string, user: User): VfsResult<void> {
    const found = this.lookup(src, user);
    if (!found.ok) return fail(found.error);
    const node = found.value;
    const readable = this.checkReadable(node, user);
    if (!readable.ok) return readable;
    if (node.type === 'dir' && isInside(dest, src)) return fail('invalid_argument');

    const existing = this.lookup(dest, user);
    if (existing.ok) {
      const target = existing.value;
      if (target.type === 'dir')
        return fail(node.type === 'dir' ? 'already_exists' : 'is_a_directory');
      if (node.type === 'dir') return fail('not_a_directory');
      if (!this.can(target, user, 'w')) return fail('permission_denied');
      target.content = node.content;
      target.mtime = this.clock();
      return ok(undefined);
    }
    if (existing.error !== 'not_found') return fail(existing.error);
    const parent = this.writableParent(dest, user);
    if (!parent.ok) return fail(parent.error);
    parent.value.children.set(basename(dest), this.cloneFor(node, basename(dest), user));
    return ok(undefined);
  }

  /** Moves or renames `src` to exactly `dest`. */
  move(src: string, dest: string, user: User): VfsResult<void> {
    if (src === '/') return fail('operation_not_permitted');
    const found = this.lookup(src, user);
    if (!found.ok) return fail(found.error);
    const node = found.value;
    if (dest !== src && isInside(dest, src)) return fail('invalid_argument');
    const srcParent = this.writableParent(src, user);
    if (!srcParent.ok) return fail(srcParent.error);

    const existing = this.lookup(dest, user);
    if (existing.ok) {
      const target = existing.value;
      if (target.type === 'dir')
        return fail(node.type === 'dir' ? 'already_exists' : 'is_a_directory');
      if (node.type === 'dir') return fail('not_a_directory');
    } else if (existing.error !== 'not_found') {
      return fail(existing.error);
    }
    const destParent = this.writableParent(dest, user);
    if (!destParent.ok) return fail(destParent.error);

    srcParent.value.children.delete(node.name);
    node.name = basename(dest);
    node.mtime = this.clock();
    destParent.value.children.set(node.name, node);
    return ok(undefined);
  }

  chmod(path: string, mode: Mode, user: User): VfsResult<void> {
    const found = this.lookup(path, user);
    if (!found.ok) return fail(found.error);
    const node = found.value;
    if (user.name !== 'root' && node.owner !== user.name) return fail('operation_not_permitted');
    node.mode = mode & 0o7777;
    return ok(undefined);
  }

  /**
   * Adds or replaces a node without permission checks, for loading mission
   * file systems. The parent folder must exist. An existing folder keeps its content.
   */
  putNode(path: string, node: VfsNode): void {
    const parent = this.stat(dirname(path));
    if (!parent || parent.type !== 'dir') throw new Error(`Parent of ${path} is not a folder`);
    const existing = parent.children.get(node.name);
    if (existing?.type === 'dir' && node.type === 'dir') {
      existing.owner = node.owner;
      existing.group = node.group;
      existing.mode = node.mode;
      return;
    }
    parent.children.set(node.name, node);
  }

  now(): number {
    return this.clock();
  }

  private writableParent(path: string, user: User): VfsResult<DirNode> {
    const found = this.lookup(dirname(path), user);
    if (!found.ok) return fail(found.error);
    const dir = found.value;
    if (dir.type !== 'dir') return fail('not_a_directory');
    if (!this.can(dir, user, 'w') || !this.can(dir, user, 'x')) return fail('permission_denied');
    return ok(dir);
  }

  private checkRemovable(dir: DirNode, user: User): VfsResult<void> {
    if (dir.children.size === 0) return ok(undefined);
    if (!this.can(dir, user, 'r') || !this.can(dir, user, 'w') || !this.can(dir, user, 'x')) {
      return fail('permission_denied');
    }
    for (const child of dir.children.values()) {
      if (child.type !== 'dir') continue;
      const result = this.checkRemovable(child, user);
      if (!result.ok) return result;
    }
    return ok(undefined);
  }

  private checkReadable(node: VfsNode, user: User): VfsResult<void> {
    if (!this.can(node, user, 'r')) return fail('permission_denied');
    if (node.type === 'file') return ok(undefined);
    if (!this.can(node, user, 'x')) return fail('permission_denied');
    for (const child of node.children.values()) {
      const result = this.checkReadable(child, user);
      if (!result.ok) return result;
    }
    return ok(undefined);
  }

  private owned(user: User) {
    return { owner: user.name, group: user.groups[0] ?? user.name };
  }

  private newFile(name: string, content: string, user: User): FileNode {
    return makeFile(name, content, { ...this.owned(user), mode: FILE_MODE }, this.clock());
  }

  private newDir(name: string, user: User): DirNode {
    return makeDir(name, { ...this.owned(user), mode: DIR_MODE }, this.clock());
  }

  private cloneFor(node: VfsNode, name: string, user: User): VfsNode {
    const meta = { ...this.owned(user), mode: node.mode & 0o755 };
    if (node.type === 'file') return makeFile(name, node.content, meta, this.clock());
    const dir = makeDir(name, meta, this.clock());
    for (const child of node.children.values()) {
      dir.children.set(child.name, this.cloneFor(child, child.name, user));
    }
    return dir;
  }
}

function toSerialized(node: VfsNode): SerializedNode {
  const { name, owner, group, mode, mtime } = node;
  if (node.type === 'file') {
    return { type: 'file', name, owner, group, mode, mtime, content: node.content };
  }
  const children = [...node.children.values()].map(toSerialized);
  return { type: 'dir', name, owner, group, mode, mtime, children };
}

function fromSerialized(data: SerializedNode): VfsNode {
  const { name, owner, group, mode, mtime } = data;
  if (data.type === 'file') return makeFile(name, data.content, { owner, group, mode }, mtime);
  const dir = makeDir(name, { owner, group, mode }, mtime);
  for (const child of data.children) dir.children.set(child.name, fromSerialized(child));
  return dir;
}

function maxMtime(node: VfsNode): number {
  if (node.type === 'file') return node.mtime;
  let max = node.mtime;
  for (const child of node.children.values()) max = Math.max(max, maxMtime(child));
  return max;
}
