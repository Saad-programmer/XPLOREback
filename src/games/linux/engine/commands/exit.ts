import type { Command } from './types';
import { SUCCESS } from './util';

export const exit: Command = {
  name: 'exit',
  help: {
    usage: 'exit',
    summary: { en: 'Try to leave the terminal.', fr: 'Essaie de quitter le terminal.' },
  },
  run(ctx) {
    ctx.emit({ type: 'special', kind: 'exit' });
    return SUCCESS;
  },
};
