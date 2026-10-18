import type { Command } from './types';
import { SUCCESS } from './util';

export const whoami: Command = {
  name: 'whoami',
  help: {
    usage: 'whoami',
    summary: { en: 'Print your user name.', fr: 'Affiche ton nom d’utilisateur.' },
  },
  run(ctx) {
    ctx.out(`${ctx.shell.user.name}\n`);
    return SUCCESS;
  },
};
