import type { Command } from './types';
import { failure, parseArgs, readSources, statusOf } from './util';

export const cat: Command = {
  name: 'cat',
  help: {
    usage: 'cat [file]...',
    summary: { en: 'Show the content of files.', fr: 'Affiche le contenu de fichiers.' },
  },
  run(ctx) {
    const args = parseArgs(ctx, {});
    if (!args) return failure('usage');
    const { sources, failed } = readSources(ctx, args.operands);
    ctx.out(sources.map((source) => source.content).join(''));
    return statusOf(failed);
  },
};
