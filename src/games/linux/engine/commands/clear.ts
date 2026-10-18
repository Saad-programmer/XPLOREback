import type { Command } from './types';
import { SUCCESS } from './util';

export const clear: Command = {
  name: 'clear',
  help: {
    usage: 'clear',
    summary: { en: 'Clear the terminal screen.', fr: 'Efface l’écran du terminal.' },
  },
  run(ctx) {
    ctx.emit({ type: 'clear' });
    return SUCCESS;
  },
};
