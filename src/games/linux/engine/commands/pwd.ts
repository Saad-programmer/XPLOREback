import type { Command } from './types';
import { SUCCESS } from './util';

export const pwd: Command = {
  name: 'pwd',
  help: {
    usage: 'pwd',
    summary: { en: 'Print the folder you are in.', fr: 'Affiche le dossier où tu es.' },
  },
  run(ctx) {
    ctx.out(`${ctx.shell.cwd}\n`);
    return SUCCESS;
  },
};
