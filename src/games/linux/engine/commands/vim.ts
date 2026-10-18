import type { Command } from './types';
import { SUCCESS } from './util';

/** A fake vim trap. The UI plays the scene and teaches :q! */
export const vim: Command = {
  name: 'vim',
  aliases: ['vi'],
  help: {
    usage: 'vim [file]',
    summary: {
      en: 'A text editor famous for being hard to quit.',
      fr: 'Un éditeur de texte célèbre parce qu’on n’arrive pas à en sortir.',
    },
  },
  run(ctx) {
    ctx.emit({ type: 'special', kind: 'vim_trap' });
    return SUCCESS;
  },
};
