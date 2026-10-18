import { pickText } from '@/src/shared/i18n/text';
import type { Command } from './types';
import { failure, SUCCESS } from './util';

export const man: Command = {
  name: 'man',
  help: {
    usage: 'man command',
    summary: {
      en: 'Show the manual page of a command.',
      fr: 'Affiche la page de manuel d’une commande.',
    },
  },
  run(ctx) {
    const [name] = ctx.args;
    if (name === undefined) {
      ctx.err("What manual page do you want?\nFor example, try 'man man'.\n");
      return failure('usage');
    }
    const { lang } = ctx.shell;
    const page = ctx.manPages[name];
    if (page !== undefined) {
      const text = pickText(page, lang);
      ctx.out(text.endsWith('\n') ? text : `${text}\n`);
      return SUCCESS;
    }
    const command = ctx.commands.get(name);
    if (!command) {
      ctx.err(`No manual entry for ${name}\n`);
      return failure('not_found', 16);
    }
    ctx.out(
      `NAME\n       ${command.name} - ${pickText(command.help.summary, lang)}\n\n` +
        `SYNOPSIS\n       ${command.help.usage}\n`,
    );
    return SUCCESS;
  },
};
