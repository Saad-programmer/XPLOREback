import { errorText, type ErrorKind } from '../types';
import { dirname } from '../vfs/path';
import { nodeSize, type VfsNode } from '../vfs/vfs';
import type { Command } from './types';
import { failure, parseArgs, SUCCESS } from './util';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Entry {
  name: string;
  node: VfsNode;
}

export function formatMode(node: VfsNode): string {
  const letters = 'rwxrwxrwx';
  let text = node.type === 'dir' ? 'd' : '-';
  for (let i = 0; i < 9; i++) text += node.mode & (1 << (8 - i)) ? letters[i] : '-';
  return text;
}

function formatDate(time: number): string {
  const date = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2);
  return `${MONTHS[date.getUTCMonth()]} ${day} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** Like ls in an English locale: dots and case are ignored when sorting. */
function sortEntries(entries: Entry[]): Entry[] {
  const key = (name: string) => name.replace(/^\.+/, '').toLowerCase();
  return entries.sort((a, b) => {
    const [ka, kb] = [key(a.name), key(b.name)];
    if (ka !== kb) return ka < kb ? -1 : 1;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
}

function formatLong(entries: Entry[]): string[] {
  const rows = entries.map(({ name, node }) => ({
    mode: formatMode(node),
    links: String(node.type === 'dir' ? 2 : 1),
    owner: node.owner,
    group: node.group,
    size: String(nodeSize(node)),
    date: formatDate(node.mtime),
    name,
  }));
  const width = (key: 'links' | 'owner' | 'group' | 'size') =>
    Math.max(...rows.map((row) => row[key].length));
  const [links, owner, group, size] = [
    width('links'),
    width('owner'),
    width('group'),
    width('size'),
  ];
  return rows.map(
    (row) =>
      `${row.mode} ${row.links.padStart(links)} ${row.owner.padEnd(owner)} ` +
      `${row.group.padEnd(group)} ${row.size.padStart(size)} ${row.date} ${row.name}`,
  );
}

/** 1K blocks, like the "total" line of ls -l. */
function totalBlocks(entries: Entry[]): number {
  return entries.reduce((sum, { node }) => sum + Math.ceil(nodeSize(node) / 4096) * 4, 0);
}

export const ls: Command = {
  name: 'ls',
  help: {
    usage: 'ls [-l] [-a] [folder or file]...',
    summary: {
      en: 'List the files in a folder. -a also shows hidden files, -l shows details.',
      fr: 'Liste les fichiers d’un dossier. -a montre aussi les fichiers cachés, -l les détails.',
    },
  },
  run(ctx) {
    const args = parseArgs(ctx, { flags: 'laA1' });
    if (!args) return failure('usage', 2);
    const long = args.flags.has('l');
    const all = args.flags.has('a');
    const almostAll = args.flags.has('A');
    const onePerLine = args.flags.has('1') || !ctx.isTty;
    const { vfs, user } = ctx.shell;
    const operands = args.operands.length ? args.operands : ['.'];
    let failed: ErrorKind | undefined;

    const files: Entry[] = [];
    const dirs: { operand: string; path: string; node: VfsNode }[] = [];
    for (const operand of operands) {
      const path = ctx.resolve(operand);
      const found = vfs.lookup(path, user);
      if (!found.ok) {
        ctx.err(`ls: cannot access '${operand}': ${errorText(found.error)}\n`);
        failed ??= found.error;
      } else if (found.value.type === 'dir') {
        dirs.push({ operand, path, node: found.value });
      } else {
        files.push({ name: operand, node: found.value });
      }
    }

    const render = (entries: Entry[]): string[] => {
      if (long) return formatLong(entries);
      const names = entries.map((entry) => entry.name);
      if (onePerLine) return names;
      return names.length ? [names.join('  ')] : [];
    };

    const blocks: string[][] = [];
    if (files.length) blocks.push(render(sortEntries(files)));
    for (const dir of dirs) {
      const listed = vfs.listDir(dir.path, user);
      if (!listed.ok) {
        ctx.err(`ls: cannot open directory '${dir.operand}': ${errorText(listed.error)}\n`);
        failed ??= listed.error;
        continue;
      }
      const entries: Entry[] = listed.value
        .filter((node) => all || almostAll || !node.name.startsWith('.'))
        .map((node) => ({ name: node.name, node }));
      if (all) {
        const parent = vfs.stat(dirname(dir.path)) ?? dir.node;
        entries.push({ name: '.', node: dir.node }, { name: '..', node: parent });
      }
      sortEntries(entries);
      const lines: string[] = [];
      if (operands.length > 1) lines.push(`${dir.operand}:`);
      if (long) lines.push(`total ${totalBlocks(entries)}`);
      lines.push(...render(entries));
      blocks.push(lines);
    }

    const text = blocks
      .filter((block) => block.length)
      .map((block) => block.join('\n'))
      .join('\n\n');
    if (text) ctx.out(`${text}\n`);
    return failed ? failure(failed, 2) : SUCCESS;
  },
};
