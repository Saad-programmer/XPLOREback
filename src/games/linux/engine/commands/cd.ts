import { errorText } from '../types';
import type { Command } from './types';
import { failure, SUCCESS } from './util';

export const cd: Command = {
  name: 'cd',
  help: {
    usage: 'cd [folder]',
    summary: {
      en: 'Go to another folder. Without a folder, go home (~). Use .. to go up.',
      fr: 'Va dans un autre dossier. Sans dossier, retour à la maison (~). Utilise .. pour remonter.',
    },
  },
  run(ctx) {
    if (ctx.args.length > 1) {
      ctx.err('cd: too many arguments\n');
      return failure('usage');
    }
    const target = ctx.args[0] ?? '~';
    const path = ctx.resolve(target);
    const { vfs, user } = ctx.shell;
    const found = vfs.lookup(path, user);
    if (!found.ok) {
      ctx.err(`cd: ${target}: ${errorText(found.error)}\n`);
      return failure(found.error);
    }
    if (found.value.type !== 'dir') {
      ctx.err(`cd: ${target}: Not a directory\n`);
      ctx.emit({ type: 'special', kind: 'cd_into_file' });
      return failure('not_a_directory');
    }
    if (!vfs.can(found.value, user, 'x')) {
      ctx.err(`cd: ${target}: Permission denied\n`);
      return failure('permission_denied');
    }
    const from = ctx.shell.cwd;
    ctx.shell.cwd = path;
    if (from !== path) ctx.emit({ type: 'cwd_changed', from, to: path });
    return SUCCESS;
  },
};
