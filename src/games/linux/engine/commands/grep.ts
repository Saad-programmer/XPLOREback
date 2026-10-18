import { errorText, type ErrorKind } from '../types';
import type { VfsNode } from '../vfs/vfs';
import { joinPath } from '../vfs/path';
import type { Command, CommandContext } from './types';
import { failure, parseArgs, readSources, splitLines, type Source } from './util';

/**
 * Basic regular expressions (grep without -E): `+ ? | ( ) { }` are plain
 * characters, and become operators only with a backslash.
 */
export function basicToJs(pattern: string): string {
  const special = '+?|(){}';
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '\\' && i + 1 < pattern.length) {
      const next = pattern[++i];
      source += special.includes(next) ? next : `\\${next}`;
    } else {
      source += special.includes(ch) ? `\\${ch}` : ch;
    }
  }
  return source;
}

/** Files under a folder, in name order, for grep -r. */
function collectFiles(
  ctx: CommandContext,
  dir: VfsNode,
  path: string,
  label: string,
  sources: Source[],
): ErrorKind | undefined {
  const { vfs, user } = ctx.shell;
  if (dir.type !== 'dir' || !vfs.can(dir, user, 'r') || !vfs.can(dir, user, 'x')) {
    ctx.err(`grep: ${label || '.'}: Permission denied\n`);
    return 'permission_denied';
  }
  let failed: ErrorKind | undefined;
  const children = [...dir.children.values()].sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const child of children) {
    const childPath = joinPath(path, child.name);
    const childLabel = label ? `${label.replace(/\/+$/, '')}/${child.name}` : child.name;
    if (child.type === 'dir') {
      failed ??= collectFiles(ctx, child, childPath, childLabel, sources);
      continue;
    }
    const read = vfs.readFile(childPath, user);
    if (read.ok) {
      sources.push({ name: childLabel, content: read.value });
    } else {
      ctx.err(`grep: ${childLabel}: ${errorText(read.error)}\n`);
      failed ??= read.error;
    }
  }
  return failed;
}

export const grep: Command = {
  name: 'grep',
  help: {
    usage: 'grep [-i] [-n] [-v] [-c] [-r] pattern [file]...',
    summary: {
      en: 'Find lines that match a pattern. -i ignores case, -n shows line numbers, -v inverts, -c counts, -r searches folders.',
      fr: 'Trouve les lignes qui contiennent un motif. -i ignore la casse, -n numérote, -v inverse, -c compte, -r cherche dans les dossiers.',
    },
  },
  run(ctx) {
    const args = parseArgs(ctx, { flags: 'invrRcE' });
    if (!args) return failure('usage', 2);
    const [pattern, ...files] = args.operands;
    if (pattern === undefined) {
      ctx.err(
        "Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.\n",
      );
      return failure('usage', 2);
    }
    let regex: RegExp;
    try {
      const source = args.flags.has('E') ? pattern : basicToJs(pattern);
      regex = new RegExp(source, args.flags.has('i') ? 'i' : '');
    } catch {
      ctx.err('grep: Invalid regular expression\n');
      return failure('usage', 2);
    }

    const recursive = args.flags.has('r') || args.flags.has('R');
    let sources: Source[];
    let failed: ErrorKind | undefined;
    let showNames: boolean;
    if (!recursive) {
      ({ sources, failed } = readSources(ctx, files));
      showNames = files.length > 1;
    } else {
      sources = [];
      const operands = files.length ? files : ['.'];
      let searchedDir = false;
      for (const operand of operands) {
        const path = ctx.resolve(operand);
        const found = ctx.shell.vfs.lookup(path, ctx.shell.user);
        if (!found.ok) {
          ctx.err(`grep: ${operand}: ${errorText(found.error)}\n`);
          failed ??= found.error;
        } else if (found.value.type === 'dir') {
          searchedDir = true;
          const label = files.length ? operand : '';
          failed = collectFiles(ctx, found.value, path, label, sources) ?? failed;
        } else {
          const read = readSources(ctx, [operand]);
          sources.push(...read.sources);
          failed ??= read.failed;
        }
      }
      showNames = operands.length > 1 || searchedDir;
    }

    const invert = args.flags.has('v');
    let matched = false;
    for (const source of sources) {
      const prefix = showNames && source.name !== null ? `${source.name}:` : '';
      const hits = splitLines(source.content)
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => regex.test(line) !== invert);
      if (hits.length) matched = true;
      if (args.flags.has('c')) {
        ctx.out(`${prefix}${hits.length}\n`);
        continue;
      }
      for (const hit of hits) {
        ctx.out(`${prefix}${args.flags.has('n') ? `${hit.number}:` : ''}${hit.line}\n`);
      }
    }
    if (failed) return failure(failed, 2);
    return { exitCode: matched ? 0 : 1 };
  },
};
