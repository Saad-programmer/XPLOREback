import type { Command } from './types';
import { failure, joinLines, parseArgs, readSources, splitLines, statusOf } from './util';

function leadingNumber(line: string): number {
  const match = /^\s*-?\d+(\.\d+)?/.exec(line);
  return match ? Number(match[0]) : 0;
}

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export const sort: Command = {
  name: 'sort',
  help: {
    usage: 'sort [-r] [-n] [-u] [file]...',
    summary: {
      en: 'Sort lines. -n sorts by number, -r reverses, -u removes duplicates.',
      fr: 'Trie les lignes. -n trie par nombre, -r inverse, -u enlève les doublons.',
    },
  },
  run(ctx) {
    const args = parseArgs(ctx, { flags: 'rnu' });
    if (!args) return failure('usage', 2);
    const { sources, failed } = readSources(ctx, args.operands);
    const numeric = args.flags.has('n');
    let lines = sources.flatMap((source) => splitLines(source.content));
    lines.sort((a, b) => {
      const byNumber = numeric ? leadingNumber(a) - leadingNumber(b) : 0;
      return byNumber || compareText(a, b);
    });
    if (args.flags.has('r')) lines.reverse();
    if (args.flags.has('u')) lines = lines.filter((line, index) => line !== lines[index - 1]);
    ctx.out(joinLines(lines));
    return statusOf(failed);
  },
};
