import { errorText, type ErrorKind } from '../types';
import { basename, joinPath } from '../vfs/path';
import type { Command } from './types';
import { failure, parseArgs, statusOf } from './util';

export const cp: Command = {
  name: 'cp',
  help: {
    usage: 'cp [-r] source... destination',
    summary: {
      en: 'Copy files. -r copies folders too.',
      fr: 'Copie des fichiers. -r copie aussi les dossiers.',
    },
  },
  run(ctx) {
    const args = parseArgs(ctx, { flags: 'rR' });
    if (!args) return failure('usage');
    const recursive = args.flags.has('r') || args.flags.has('R');
    const { operands } = args;
    const tryHelp = "Try 'cp --help' for more information.\n";
    if (operands.length === 0) {
      ctx.err(`cp: missing file operand\n${tryHelp}`);
      return failure('usage');
    }
    if (operands.length === 1) {
      ctx.err(`cp: missing destination file operand after '${operands[0]}'\n${tryHelp}`);
      return failure('usage');
    }

    const { vfs, user } = ctx.shell;
    const dest = operands[operands.length - 1];
    const destPath = ctx.resolve(dest);
    const intoDir = vfs.stat(destPath)?.type === 'dir';
    const sources = operands.slice(0, -1);
    if (sources.length > 1 && !intoDir) {
      ctx.err(`cp: target '${dest}' is not a directory\n`);
      return failure('not_a_directory');
    }

    let failed: ErrorKind | undefined;
    for (const source of sources) {
      const srcPath = ctx.resolve(source);
      const found = vfs.lookup(srcPath, user);
      if (!found.ok) {
        ctx.err(`cp: cannot stat '${source}': ${errorText(found.error)}\n`);
        failed ??= found.error;
        continue;
      }
      const nodeType = found.value.type;
      if (nodeType === 'dir' && !recursive) {
        ctx.err(`cp: -r not specified; omitting directory '${source}'\n`);
        failed ??= 'is_a_directory';
        continue;
      }
      const target = intoDir ? joinPath(destPath, basename(srcPath)) : destPath;
      if (target === srcPath) {
        ctx.err(`cp: '${source}' and '${dest}' are the same file\n`);
        failed ??= 'invalid_argument';
        continue;
      }
      const existed = vfs.stat(target) !== null;
      const copied = vfs.copy(srcPath, target, user);
      if (!copied.ok) {
        ctx.err(
          copied.error === 'invalid_argument'
            ? `cp: cannot copy a directory, '${source}', into itself, '${dest}'\n`
            : `cp: cannot create ${nodeType === 'dir' ? 'directory' : 'regular file'} '${dest}': ${errorText(copied.error)}\n`,
        );
        failed ??= copied.error;
        continue;
      }
      ctx.emit({
        type: 'fs_changed',
        change: existed ? 'modify' : 'create',
        path: target,
        nodeType,
      });
    }
    return statusOf(failed);
  },
};
