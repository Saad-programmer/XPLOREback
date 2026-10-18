import type { Command } from './types';
import { SUCCESS } from './util';

export const echo: Command = {
  name: 'echo',
  rawArgs: true,
  help: {
    usage: 'echo [-n] [text]...',
    summary: {
      en: 'Print text. Useful with > to write into a file.',
      fr: 'Affiche du texte. Pratique avec > pour écrire dans un fichier.',
    },
  },
  run(ctx) {
    const noNewline = ctx.args[0] === '-n';
    const words = noNewline ? ctx.args.slice(1) : ctx.args;
    ctx.out(words.join(' ') + (noNewline ? '' : '\n'));
    return SUCCESS;
  },
};
