import { errorText, type ErrorKind } from '../types';
import type { Command } from './types';
import { failure, parseArgs, statusOf } from './util';

export const mkdir: Command = {
  name: 'mkdir',
  help: {
    usage: 'mkdir [-p] folder...',
    summary: {
      en: 'Create folders. -p also creates the missing parent folders.',
      fr: 'Crée des dossiers. -p crée aussi les dossiers parents manquants.',
    },
  },
  run(ctx) {
    const args = parseArgs(ctx, { flags: 'p' });
    if (!args) return failure('usage');
    if (args.operands.length === 0) {
      ctx.err("mkdir: missing operand\nTry 'mkdir --help' for more information.\n");
      return failure('usage');
    }
    let failed: ErrorKind | undefined;
    for (const operand of args.operands) {
      const made = ctx.shell.vfs.mkdir(ctx.resolve(operand), ctx.shell.user, args.flags.has('p'));
      if (!made.ok) {
        ctx.err(`mkdir: cannot create directory '${operand}': ${errorText(made.error)}\n`);
        failed ??= made.error;
        continue;
      }
      for (const path of made.value) {
        ctx.emit({ type: 'fs_changed', change: 'create', path, nodeType: 'dir' });
      }
    }
    return statusOf(failed);
  },
};
