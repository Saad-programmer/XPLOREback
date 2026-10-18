import { pickText } from '@/src/shared/i18n/text';
import type { Command } from './types';
import { failure, formatUsage, SUCCESS } from './util';

const HEADER = {
  en: 'Commands available in this terminal:',
  fr: 'Commandes disponibles dans ce terminal :',
};
const FOOTER = {
  en: "Type 'man <command>' to learn more about one command.",
  fr: "Tape 'man <commande>' pour en savoir plus sur une commande.",
};

export const help: Command = {
  name: 'help',
  help: {
    usage: 'help [command]',
    summary: {
      en: 'List the commands you can use.',
      fr: 'Liste les commandes que tu peux utiliser.',
    },
  },
  run(ctx) {
    const { lang } = ctx.shell;
    const [name] = ctx.args;
    if (name !== undefined) {
      const command = ctx.commands.get(name);
      if (!command) {
        ctx.err(`help: no help topics match '${name}'\n`);
        return failure('not_found');
      }
      ctx.out(formatUsage(command, lang));
      return SUCCESS;
    }
    const commands = ctx.commands.list();
    const width = Math.max(...commands.map((command) => command.help.usage.length));
    const lines = commands.map(
      (command) => `  ${command.help.usage.padEnd(width)}  ${pickText(command.help.summary, lang)}`,
    );
    ctx.out(`${pickText(HEADER, lang)}\n\n${lines.join('\n')}\n\n${pickText(FOOTER, lang)}\n`);
    return SUCCESS;
  },
};
