import type { Command } from './types';
import { failure, parseArgs, readSources, statusOf } from './util';

const encoder = new TextEncoder();
type Count = 'l' | 'w' | 'c';

export const wc: Command = {
  name: 'wc',
  help: {
    usage: 'wc [-l] [-w] [-c] [file]...',
    summary: {
      en: 'Count lines (-l), words (-w) and bytes (-c).',
      fr: 'Compte les lignes (-l), les mots (-w) et les octets (-c).',
    },
  },
  run(ctx) {
    const args = parseArgs(ctx, { flags: 'lwc' });
    if (!args) return failure('usage');
    const chosen = (['l', 'w', 'c'] as Count[]).filter((flag) => args.flags.has(flag));
    const selected: Count[] = chosen.length ? chosen : ['l', 'w', 'c'];
    const { sources, failed } = readSources(ctx, args.operands);

    const rows = sources.map((source) => ({
      name: source.name,
      l: (source.content.match(/\n/g) ?? []).length,
      w: source.content.split(/\s+/).filter(Boolean).length,
      c: encoder.encode(source.content).length,
    }));
    if (rows.length > 1) {
      const sum = (key: Count) => rows.reduce((total, row) => total + row[key], 0);
      rows.push({ name: 'total', l: sum('l'), w: sum('w'), c: sum('c') });
    }

    // Like GNU wc: no padding for a single number, width 7 for standard input.
    const numbers = rows.flatMap((row) => selected.map((key) => row[key]));
    const single = selected.length === 1 && rows.length === 1;
    const fromStdin = sources.some((source) => source.name === null);
    const width = single ? 0 : fromStdin ? 7 : Math.max(...numbers.map((n) => String(n).length));
    for (const row of rows) {
      const counts = selected.map((key) => String(row[key]).padStart(width)).join(' ');
      ctx.out(`${counts}${row.name === null ? '' : ` ${row.name}`}\n`);
    }
    return statusOf(failed);
  },
};
