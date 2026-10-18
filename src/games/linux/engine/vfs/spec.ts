import { applySecrets } from '../secrets';
import type { User } from '../types';
import { isInside, joinPath, normalize, segments } from './path';
import { createFakeClock, DIR_MODE, FILE_MODE, makeDir, makeFile, Vfs } from './vfs';

/** File system as written in mission files (see docs/ARCHITECTURE.md 3.5). */
export interface FileSpec {
  type?: 'file';
  content: string;
  mode?: string;
  owner?: string;
  group?: string;
}

export interface DirSpec {
  type: 'dir';
  mode?: string;
  owner?: string;
  group?: string;
  children?: Record<string, FsEntrySpec>;
}

/** A plain string is a file with that content. */
export type FsEntrySpec = string | FileSpec | DirSpec;

/** Absolute folder path -> entries in that folder. */
export type FsSpec = Record<string, Record<string, FsEntrySpec>>;

interface BuildOptions {
  secrets?: Record<string, string>;
  clock?: () => number;
}

/**
 * Builds the starting file system of a mission. Everything inside the player's
 * home belongs to the player by default, everything else to root.
 */
export function buildVfs(spec: FsSpec, user: User, options: BuildOptions = {}): Vfs {
  const clock = options.clock ?? createFakeClock();
  const secrets = options.secrets ?? {};
  const vfs = Vfs.empty(clock);
  const ownerOf = (path: string) => (isInside(path, user.home) ? user.name : 'root');
  const groupOf = (owner: string) => (owner === user.name ? (user.groups[0] ?? owner) : owner);

  const ensureDir = (path: string) => {
    let current = '/';
    for (const part of segments(path)) {
      current = joinPath(current, part);
      const existing = vfs.stat(current);
      if (existing?.type === 'file') throw new Error(`${current} is a file, not a folder`);
      if (existing) continue;
      const owner = ownerOf(current);
      vfs.putNode(
        current,
        makeDir(part, { owner, group: groupOf(owner), mode: DIR_MODE }, clock()),
      );
    }
  };

  const addEntries = (dir: string, entries: Record<string, FsEntrySpec>) => {
    for (const [name, entry] of Object.entries(entries)) {
      const path = joinPath(dir, name);
      if (typeof entry === 'string' || entry.type !== 'dir') {
        const file = typeof entry === 'string' ? { content: entry } : entry;
        const owner = file.owner ?? ownerOf(path);
        const content = withNewline(applySecrets(file.content, secrets));
        const meta = {
          owner,
          group: file.group ?? groupOf(owner),
          mode: parseMode(file.mode, FILE_MODE),
        };
        vfs.putNode(path, makeFile(name, content, meta, clock()));
        continue;
      }
      const owner = entry.owner ?? ownerOf(path);
      const meta = {
        owner,
        group: entry.group ?? groupOf(owner),
        mode: parseMode(entry.mode, DIR_MODE),
      };
      vfs.putNode(path, makeDir(name, meta, clock()));
      addEntries(path, entry.children ?? {});
    }
  };

  ensureDir(user.home);
  for (const [dirPath, entries] of Object.entries(spec)) {
    const dir = normalize(dirPath);
    ensureDir(dir);
    addEntries(dir, entries);
  }
  return vfs;
}

function parseMode(mode: string | undefined, fallback: number): number {
  return mode ? parseInt(mode, 8) : fallback;
}

/** Files end with a newline, like files made with a text editor. */
function withNewline(text: string): string {
  return text === '' || text.endsWith('\n') ? text : `${text}\n`;
}
