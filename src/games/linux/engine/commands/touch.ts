import { errorText, type ErrorKind } from '../types';
import type { Command } from './types';
import { failure, parseArgs, statusOf } from './util';

export const touch: Command = {
  name: 'touch',
  help: {
    usage: 'touch file...',
    summary: {
      en: 'Create empty files (or update the date of existing ones).',
      fr: 'Crée des fichiers vides (ou met à jour la date des fichiers existants).',
    },
  },
  run(ctx) {
    const args = parseArgs(ctx, {});
    if (!args) return failure('usage');
    if (args.operands.length === 0) {
      ctx.err("touch: missing file operand\nTry 'touch --help' for more information.\n");
      return failure('usage');
    }
    let failed: ErrorKind | undefined;
    for (const operand of args.operands) {
      const path = ctx.resolve(operand);
      const touched = ctx.shell.vfs.touch(path, ctx.shell.user);
      if (!touched.ok) {
        ctx.err(`touch: cannot touch '${operand}': ${errorText(touched.error)}\n`);
        failed ??= touched.error;
      } else if (touched.value.created) {
        ctx.emit({ type: 'fs_changed', change: 'create', path, nodeType: 'file' });
      }
    }
    return statusOf(failed);
  },
};
