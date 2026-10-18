import { errorText, type ErrorKind } from '../types';
import type { VfsNode } from '../vfs/vfs';
import type { Command } from './types';
import { failure, globToRegExp, lastSegment, statusOf } from './util';

type Test = (name: string, node: VfsNode) => boolean;

export const find: Command = {
  name: 'find',
  help: {
    usage: 'find [folder]... [-name pattern] [-iname pattern] [-type f|d]',
    summary: {
      en: 'Search for files in a folder and all its sub-folders. Put patterns in quotes: -name "*.txt".',
      fr: 'Cherche des fichiers dans un dossier et tous ses sous-dossiers. Mets les motifs entre guillemets : -name "*.txt".',
    },
  },
  run(ctx) {
    const { args } = ctx;
    const starts: string[] = [];
    let i = 0;
    while (i < args.length && !args[i].startsWith('-')) starts.push(args[i++]);

    const tests: Test[] = [];
    while (i < args.length) {
      const flag = args[i++];
      if (!['-name', '-iname', '-type'].includes(flag)) {
        ctx.err(`find: unknown predicate '${flag}'\n`);
        return failure('usage');
      }
      const value = args[i++];
      if (value === undefined) {
        ctx.err(`find: missing argument to '${flag}'\n`);
        return failure('usage');
      }
      if (flag === '-type') {
        if (value !== 'f' && value !== 'd') {
          ctx.err(`find: Unknown argument to -type: ${value}\n`);
          return failure('usage');
        }
        tests.push((_, node) => (node.type === 'dir') === (value === 'd'));
      } else {
        const regex = globToRegExp(value, flag === '-iname');
        tests.push((name) => regex.test(name));
      }
    }

    const { vfs, user } = ctx.shell;
    let failed: ErrorKind | undefined;
    const visit = (node: VfsNode, label: string, name: string) => {
      if (tests.every((test) => test(name, node))) ctx.out(`${label}\n`);
      if (node.type !== 'dir') return;
      if (!vfs.can(node, user, 'r') || !vfs.can(node, user, 'x')) {
        ctx.err(`find: '${label}': Permission denied\n`);
        failed ??= 'permission_denied';
        return;
      }
      const children = [...node.children.values()].sort((a, b) => (a.name < b.name ? -1 : 1));
      for (const child of children) {
        visit(child, label === '/' ? `/${child.name}` : `${label}/${child.name}`, child.name);
      }
    };

    for (const start of starts.length ? starts : ['.']) {
      const found = vfs.lookup(ctx.resolve(start), user);
      if (!found.ok) {
        ctx.err(`find: '${start}': ${errorText(found.error)}\n`);
        failed ??= found.error;
        continue;
      }
      const label = start === '/' ? '/' : start.replace(/\/+$/, '');
      visit(found.value, label, lastSegment(start));
    }
    return statusOf(failed);
  },
};
