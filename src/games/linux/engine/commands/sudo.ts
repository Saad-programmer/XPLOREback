import type { Command } from './types';
import { failure } from './util';

const SPAM_STREAK = 3;

/** Always refused: the player never gets admin rights. The UI adds the joke. */
export const sudo: Command = {
  name: 'sudo',
  help: {
    usage: 'sudo command',
    summary: {
      en: 'Run a command as the admin (root). Not for you on this server!',
      fr: 'Lance une commande en tant qu’admin (root). Pas pour toi sur ce serveur !',
    },
  },
  run(ctx) {
    if (ctx.args.length === 0) {
      ctx.err('usage: sudo command\n');
      return failure('usage');
    }
    ctx.shell.sudoStreak++;
    ctx.emit({ type: 'special', kind: 'sudo' });
    if (ctx.shell.sudoStreak === SPAM_STREAK) ctx.emit({ type: 'special', kind: 'sudo_spam' });
    ctx.err(
      `${ctx.shell.user.name} is not in the sudoers file.  This incident will be reported.\n`,
    );
    return failure('refused');
  },
};
