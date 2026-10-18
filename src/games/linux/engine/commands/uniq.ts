import type { Command } from './types';
import { failure, joinLines, parseArgs, readSources, splitLines, statusOf } from './util';

export const uniq: Command = {
  name: 'uniq',
  help: {
    usage: 'uniq [-c] [file]',
    summary: {
      en: 'Remove repeated lines that are next to each other (use sort first). -c counts them.',
      fr: 'Enlève les lignes répétées qui se suivent (utilise sort avant). -c les compte.',
    },
  },
  run(ctx) {
    const args = parseArgs(ctx, { flags: 'c' });
    if (!args) return failure('usage');
    const { sources, failed } = readSources(ctx, args.operands.slice(0, 1));
    const groups: { line: string; count: number }[] = [];
    for (const line of splitLines(sources[0]?.content ?? '')) {
      const last = groups[groups.length - 1];
      if (last && last.line === line) last.count++;
      else groups.push({ line, count: 1 });
    }
    const counted = args.flags.has('c');
    ctx.out(
      joinLines(
        groups.map(({ line, count }) => (counted ? `${String(count).padStart(7)} ${line}` : line)),
      ),
    );
    return statusOf(failed);
  },
};
