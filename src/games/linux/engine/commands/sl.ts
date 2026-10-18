import type { Command } from './types';
import { SUCCESS } from './util';

/** The classic joke for people who type sl instead of ls. The UI shows the train. */
export const sl: Command = {
  name: 'sl',
  help: {
    usage: 'sl',
    summary: {
      en: 'Choo choo! (You probably meant ls.)',
      fr: 'Tchou tchou ! (Tu voulais sûrement taper ls.)',
    },
  },
  run(ctx) {
    ctx.emit({ type: 'special', kind: 'sl' });
    return SUCCESS;
  },
};
