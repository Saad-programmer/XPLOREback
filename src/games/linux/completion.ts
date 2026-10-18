import type { Shell } from './engine/shell';
import { resolvePath } from './engine/vfs/path';

export interface Completion {
  /** The line after completion (unchanged when nothing matches). */
  line: string;
  /** Matching names to show when the completion is ambiguous. Folders end with `/`. */
  candidates: string[];
}

function commonPrefix(words: string[]): string {
  let prefix = words[0] ?? '';
  for (const word of words) {
    while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

/**
 * Bash-like Tab completion of the last word: command names at the start of a
 * line or after a pipe, file and folder names everywhere else. Hidden files
 * only complete when the typed name starts with a dot.
 */
export function complete(shell: Shell, line: string): Completion {
  const word = /\S*$/.exec(line)?.[0] ?? '';
  const before = line.slice(0, line.length - word.length);
  const atCommand = before.trim() === '' || /\|\s*$/.test(before);

  let entries: { name: string; dir: boolean }[];
  let typed = word;
  let dirPart = '';
  if (atCommand && !word.includes('/')) {
    entries = shell.commandNames().map((name) => ({ name, dir: false }));
  } else {
    const slash = word.lastIndexOf('/');
    dirPart = word.slice(0, slash + 1);
    typed = word.slice(slash + 1);
    const dirPath = resolvePath(dirPart || '.', shell.cwd(), shell.user.home);
    const listed = shell.vfs.listDir(dirPath, shell.user);
    entries = listed.ok
      ? listed.value
          .filter((node) => typed.startsWith('.') || !node.name.startsWith('.'))
          .map((node) => ({ name: node.name, dir: node.type === 'dir' }))
      : [];
  }

  const matches = entries
    .filter((entry) => entry.name.startsWith(typed))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
  if (matches.length === 0) return { line, candidates: [] };
  if (matches.length === 1) {
    const [only] = matches;
    return { line: `${before}${dirPart}${only.name}${only.dir ? '/' : ' '}`, candidates: [] };
  }
  const prefix = commonPrefix(matches.map((entry) => entry.name));
  return {
    line: `${before}${dirPart}${prefix}`,
    candidates: matches.map((entry) => (entry.dir ? `${entry.name}/` : entry.name)),
  };
}
