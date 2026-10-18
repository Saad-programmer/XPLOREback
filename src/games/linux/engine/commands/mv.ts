import { errorText, type ErrorKind } from '../types';
import { basename, joinPath } from '../vfs/path';
import type { Command } from './types';
import { failure, parseArgs, statusOf } from './util';

export const mv: Command = {
  name: 'mv',
  help: {
    usage: 'mv source... destination',
    summary: {
      en: 'Move or rename files and folders.',
      fr: 'Déplace ou renomme des fichiers et des dossiers.',
    },
  },
  run(ctx) {
    const args = parseArgs(ctx, { flags: 'f' });
    if (!args) return failure('usage');
    const { operands } = args;
    const tryHelp = "Try 'mv --help' for more information.\n";
    if (operands.length === 0) {
      ctx.err(`mv: missing file operand\n${tryHelp}`);
      return failure('usage');
    }
    if (operands.length === 1) {
      ctx.err(`mv: missing destination file operand after '${operands[0]}'\n${tryHelp}`);
      return failure('usage');
    }

    const { vfs, user } = ctx.shell;
    const dest = operands[operands.length - 1];
    const destPath = ctx.resolve(dest);
    const intoDir = vfs.stat(destPath)?.type === 'dir';
    const sources = operands.slice(0, -1);
    if (sources.length > 1 && !intoDir) {
      ctx.err(`mv: target '${dest}' is not a directory\n`);
      return failure('not_a_directory');
    }

    let failed: ErrorKind | undefined;
    for (const source of sources) {
      const srcPath = ctx.resolve(source);
      const found = vfs.lookup(srcPath, user);
      if (!found.ok) {
        ctx.err(`mv: cannot stat '${source}': ${errorText(found.error)}\n`);
        failed ??= found.error;
        continue;
      }
      const target = intoDir ? joinPath(destPath, basename(srcPath)) : destPath;
      if (target === srcPath) {
        ctx.err(`mv: '${source}' and '${dest}' are the same file\n`);
        failed ??= 'invalid_argument';
        continue;
      }
      const moved = vfs.move(srcPath, target, user);
      if (!moved.ok) {
        ctx.err(
          moved.error === 'invalid_argument'
            ? `mv: cannot move '${source}' to a subdirectory of itself, '${intoDir ? `${dest.replace(/\/+$/, '')}/${basename(srcPath)}` : dest}'\n`
            : `mv: cannot move '${source}' to '${dest}': ${errorText(moved.error)}\n`,
        );
        failed ??= moved.error;
        continue;
      }
      ctx.emit({
        type: 'fs_changed',
        change: 'move',
        path: srcPath,
        to: target,
        nodeType: found.value.type,
      });
    }
    return statusOf(failed);
  },
};
