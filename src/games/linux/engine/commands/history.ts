import type { Command } from './types';
import { joinLines, SUCCESS } from './util';

export const history: Command = {
  name: 'history',
  help: {
    usage: 'history',
    summary: {
      en: 'Show the commands you typed. The up arrow brings them back.',
      fr: 'Affiche les commandes que tu as tapées. La flèche du haut les rappelle.',
    },
  },
  run(ctx) {
    const lines = ctx.shell.history.map(
      (line, index) => `${String(index + 1).padStart(5)}  ${line}`,
    );
    ctx.out(joinLines(lines));
    return SUCCESS;
  },
};
