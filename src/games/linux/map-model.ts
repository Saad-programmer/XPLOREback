import type { EngineEvent, EventOf } from './engine/events';
import { joinPath, resolvePath, segments } from './engine/vfs/path';
import type { Vfs, VfsNode } from './engine/vfs/vfs';

/**
 * The live map shows only what the player has discovered ("fog of war"):
 * folders they walked through or listed, files they listed, read or created.
 */
export interface MapNode {
  path: string;
  name: string;
  type: 'file' | 'dir';
  hidden: boolean;
  /** A folder with children the player has not listed yet. */
  unexplored: boolean;
  children: MapNode[];
}

export function ancestorsOf(path: string): string[] {
  const result = ['/'];
  let current = '/';
  for (const part of segments(path)) {
    current = joinPath(current, part);
    result.push(current);
  }
  return result;
}

function sortNodes(a: VfsNode, b: VfsNode): number {
  if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
  return a.name.replace(/^\./, '') < b.name.replace(/^\./, '') ? -1 : 1;
}

export function buildMapTree(vfs: Vfs, known: ReadonlySet<string>): MapNode {
  const visit = (node: VfsNode, path: string): MapNode => {
    const children =
      node.type === 'dir'
        ? [...node.children.values()]
            .sort(sortNodes)
            .filter((child) => known.has(joinPath(path, child.name)))
            .map((child) => visit(child, joinPath(path, child.name)))
        : [];
    const unexplored =
      node.type === 'dir' &&
      [...node.children.values()].some(
        (child) => !child.name.startsWith('.') && !known.has(joinPath(path, child.name)),
      );
    return {
      path,
      name: path === '/' ? '/' : node.name,
      type: node.type,
      hidden: node.name.startsWith('.'),
      unexplored,
      children,
    };
  };
  return visit(vfs.stat('/')!, '/');
}

/** The current folder and its parents are always known. */
export function initialKnown(cwd: string): Set<string> {
  return new Set(ancestorsOf(cwd));
}

const isFlag = (arg: string) => arg.startsWith('-') && arg !== '-';

function revealTree(vfs: Vfs, path: string, known: Set<string>): void {
  known.add(path);
  const node = vfs.stat(path);
  if (node?.type !== 'dir') return;
  for (const child of node.children.keys()) revealTree(vfs, joinPath(path, child), known);
}

/**
 * Updates what the player knows after one line: what ls listed, what was
 * read, what find or grep -r walked through, and every file system change.
 */
export function revealAfterLine(
  known: ReadonlySet<string>,
  vfs: Vfs,
  context: { cwdBefore: string; cwdAfter: string; home: string },
  command: EventOf<'command'> | null,
  changes: EventOf<'fs_changed'>[],
): Set<string> {
  const next = new Set(known);
  const resolve = (arg: string) => resolvePath(arg, context.cwdBefore, context.home);
  const addWithParents = (path: string) => ancestorsOf(path).forEach((p) => next.add(p));

  addWithParents(context.cwdAfter);

  if (command && command.exitCode !== 127) {
    const flags = command.args.filter(isFlag).join('');
    const operands = command.args.filter((arg) => !isFlag(arg));
    switch (command.name) {
      case 'ls': {
        const showHidden = /[aA]/.test(flags);
        for (const operand of operands.length ? operands : ['.']) {
          const path = resolve(operand);
          const node = vfs.stat(path);
          if (!node) continue;
          addWithParents(path);
          if (node.type !== 'dir') continue;
          for (const child of node.children.keys()) {
            if (showHidden || !child.startsWith('.')) next.add(joinPath(path, child));
          }
        }
        break;
      }
      case 'cat':
      case 'head':
      case 'tail':
      case 'wc':
        for (const operand of operands) {
          const path = resolve(operand);
          if (vfs.stat(path)?.type === 'file') addWithParents(path);
        }
        break;
      case 'grep': {
        const [, ...files] = operands;
        const recursive = /[rR]/.test(flags);
        for (const file of recursive && files.length === 0 ? ['.'] : files) {
          const path = resolve(file);
          if (!vfs.stat(path)) continue;
          addWithParents(path);
          if (recursive) revealTree(vfs, path, next);
        }
        break;
      }
      case 'find': {
        const firstOption = command.args.findIndex(isFlag);
        const starts = firstOption === -1 ? command.args : command.args.slice(0, firstOption);
        for (const start of starts.length ? starts : ['.']) {
          const path = resolve(start);
          if (!vfs.stat(path)) continue;
          addWithParents(path);
          revealTree(vfs, path, next);
        }
        break;
      }
    }
  }

  for (const change of changes) {
    if (change.change === 'delete') {
      for (const path of [...next]) {
        if (path === change.path || path.startsWith(`${change.path}/`)) next.delete(path);
      }
    } else if (change.change === 'move' && change.to) {
      for (const path of [...next]) {
        if (path === change.path || path.startsWith(`${change.path}/`)) {
          next.delete(path);
          next.add(change.to + path.slice(change.path.length));
        }
      }
      addWithParents(change.to);
    } else {
      addWithParents(change.path);
    }
  }
  // Drop anything that no longer exists (e.g. removed by rm -r).
  for (const path of [...next]) if (!vfs.stat(path)) next.delete(path);
  next.add('/');
  return next;
}

export function isFsChange(event: EngineEvent): event is EventOf<'fs_changed'> {
  return event.type === 'fs_changed';
}
