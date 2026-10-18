import { runLinePicker } from './head';
import type { Command } from './types';

export const tail: Command = {
  name: 'tail',
  help: {
    usage: 'tail [-n lines] [file]...',
    summary: {
      en: 'Show the last lines of a file (10 by default).',
      fr: 'Affiche les dernières lignes d’un fichier (10 par défaut).',
    },
  },
  run: (ctx) =>
    runLinePicker(ctx, (lines, count) => lines.slice(Math.max(lines.length - count, 0))),
};
