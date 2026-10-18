import { errorText, type ErrorKind } from '../types';
import type { Command } from './types';
import { failure, lastSegment, parseArgs, statusOf } from './util';

export const rm: Command = {
  name: 'rm',
  help: {
    usage: 'rm [-r] [-f] file...',
    summary: {
      en: 'Delete files. -r deletes folders, -f ignores missing files. There is no trash!',
      fr: 'Supprime des fichiers. -r supprime les dossiers, -f ignore les fichiers absents. Pas de corbeille !',
    },
  },
  run(ctx) {
    const args = parseArgs(ctx, { flags: 'rRf' });
    if (!args) return failure('usage');
    const recursive = args.flags.has('r') || args.flags.has('R');
    const force = args.flags.has('f');
    if (args.operands.length === 0) {
      if (force) return { exitCode: 0 };
      ctx.err("rm: missing operand\nTry 'rm --help' for more information.\n");
      return failure('usage');
    }

    const { vfs, user } = ctx.shell;
    let failed: ErrorKind | undefined;
    for (const operand of args.operands) {
      const path = ctx.resolve(operand);
      if (path === '/' && recursive) {
        // The real GNU failsafe, word for word.
        ctx.err(
          "rm: it is dangerous to operate recursively on '/'\n" +
            'rm: use --no-preserve-root to override this failsafe\n',
        );
        ctx.emit({ type: 'special', kind: 'rm_rf_root' });
        failed ??= 'refused';
        continue;
      }
      const last = lastSegment(operand);
      if (last === '.' || last === '..') {
        ctx.err(`rm: refusing to remove '.' or '..' directory: skipping '${operand}'\n`);
        failed ??= 'refused';
        continue;
      }
      const found = vfs.lookup(path, user);
      if (!found.ok) {
        if (force && found.error === 'not_found') continue;
        ctx.err(`rm: cannot remove '${operand}': ${errorText(found.error)}\n`);
        failed ??= found.error;
        continue;
      }
      const removed = vfs.remove(path, user, recursive);
      if (!removed.ok) {
        ctx.err(`rm: cannot remove '${operand}': ${errorText(removed.error)}\n`);
        failed ??= removed.error;
        continue;
      }
      ctx.emit({ type: 'fs_changed', change: 'delete', path, nodeType: found.value.type });
    }
    return statusOf(failed);
  },
};
