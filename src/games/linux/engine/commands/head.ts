import { errorText } from '../types';
import type { Command, CommandContext, CommandStatus } from './types';
import { failure, joinLines, parseArgs, readSources, splitLines, statusOf } from './util';

/** Shared by head and tail: `-n N`, `-nN` and the old `-N` form. */
export function runLinePicker(
  ctx: CommandContext,
  pick: (lines: string[], count: number) => string[],
): CommandStatus {
  const args = parseArgs(
    ctx,
    { values: 'n' },
    ctx.args.map((arg) => (/^-\d+$/.test(arg) ? `-n${arg.slice(1)}` : arg)),
  );
  if (!args) return failure('usage');
  const countText = args.values.get('n') ?? '10';
  if (!/^\d+$/.test(countText)) {
    ctx.err(`${ctx.name}: invalid number of lines: '${countText}'\n`);
    return failure('usage');
  }
  const count = Number(countText);
  const { sources, failed } = readSources(
    ctx,
    args.operands,
    (operand, kind) => `${ctx.name}: cannot open '${operand}' for reading: ${errorText(kind)}`,
  );
  const blocks = sources.map((source) => {
    const body = joinLines(pick(splitLines(source.content), count));
    if (sources.length < 2) return body;
    return `==> ${source.name ?? 'standard input'} <==\n${body}`;
  });
  ctx.out(blocks.join('\n'));
  return statusOf(failed);
}

export const head: Command = {
  name: 'head',
  help: {
    usage: 'head [-n lines] [file]...',
    summary: {
      en: 'Show the first lines of a file (10 by default).',
      fr: 'Affiche les premières lignes d’un fichier (10 par défaut).',
    },
  },
  run: (ctx) => runLinePicker(ctx, (lines, count) => lines.slice(0, count)),
};
