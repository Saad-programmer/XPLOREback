import { describe, expect, it } from 'vitest';
import { basicToJs } from '@/src/games/linux/engine/commands/grep';
import { globToRegExp } from '@/src/games/linux/engine/commands/util';
import { HOME, makeShell } from './helpers';

const log = ['INFO start', 'WARN disk', 'info password=hunter2', 'ERROR crash', 'INFO done'].join(
  '\n',
);
const fs = {
  [HOME]: {
    'server.log': log,
    'other.log': 'nothing\npassword=other',
    deep: {
      type: 'dir' as const,
      children: {
        'a.txt': 'x',
        more: { type: 'dir' as const, children: { 'lost_key.txt': 'KEY', 'b.md': 'y' } },
      },
    },
  },
  '/vault': { locked: { type: 'dir' as const, mode: '700', children: { 'k.txt': 'k' } } },
};

describe('grep', () => {
  it('prints matching lines', () => {
    expect(makeShell(fs).run('grep INFO server.log').stdout).toBe('INFO start\nINFO done\n');
  });

  it('supports -i, -n, -v and -c', () => {
    const shell = makeShell(fs);
    expect(shell.run('grep -i info server.log').stdout.split('\n')).toHaveLength(4);
    expect(shell.run('grep -n WARN server.log').stdout).toBe('2:WARN disk\n');
    expect(shell.run('grep -vc INFO server.log').stdout).toBe('3\n');
    expect(shell.run('grep -in password server.log').stdout).toBe('3:info password=hunter2\n');
  });

  it('prefixes file names with several files', () => {
    expect(makeShell(fs).run('grep password server.log other.log').stdout).toBe(
      'server.log:info password=hunter2\nother.log:password=other\n',
    );
  });

  it('searches folders with -r', () => {
    const shell = makeShell(fs);
    expect(shell.run('grep -r KEY deep').stdout).toBe('deep/more/lost_key.txt:KEY\n');
    shell.run('cd deep');
    expect(shell.run('grep -r KEY').stdout).toBe('more/lost_key.txt:KEY\n');
    expect(shell.run('grep -r KEY .').stdout).toBe('./more/lost_key.txt:KEY\n');
  });

  it('reads standard input and returns 1 when nothing matches', () => {
    const shell = makeShell(fs);
    expect(shell.run('cat server.log | grep ERROR').stdout).toBe('ERROR crash\n');
    expect(shell.run('grep nope server.log').exitCode).toBe(1);
  });

  it('uses basic regular expressions like real grep', () => {
    expect(basicToJs('a+b')).toBe('a\\+b');
    expect(basicToJs('a\\|b')).toBe('a|b');
    const shell = makeShell(fs);
    expect(shell.run('grep "^INFO" server.log').stdout).toBe('INFO start\nINFO done\n');
    expect(shell.run('grep "ERROR\\|WARN" server.log').stdout).toBe('WARN disk\nERROR crash\n');
  });

  it('uses real error messages', () => {
    const shell = makeShell(fs);
    expect(shell.run('grep x ghost').stderr).toBe('grep: ghost: No such file or directory\n');
    expect(shell.run('grep x deep').stderr).toBe('grep: deep: Is a directory\n');
    expect(shell.run('grep').exitCode).toBe(2);
  });
});

describe('find', () => {
  it('lists everything below a folder', () => {
    expect(makeShell(fs).run('find deep').stdout).toBe(
      'deep\ndeep/a.txt\ndeep/more\ndeep/more/b.md\ndeep/more/lost_key.txt\n',
    );
  });

  it('filters with -name, -iname and -type', () => {
    const shell = makeShell(fs);
    expect(shell.run('find . -name lost_key.txt').stdout).toBe('./deep/more/lost_key.txt\n');
    expect(shell.run('find . -name "*.md"').stdout).toBe('./deep/more/b.md\n');
    expect(shell.run('find deep -type d').stdout).toBe('deep\ndeep/more\n');
    expect(shell.run('find . -iname "LOST*"').stdout).toBe('./deep/more/lost_key.txt\n');
  });

  it('reports folders it cannot open', () => {
    const result = makeShell(fs).run('find /vault');
    expect(result.stdout).toBe('/vault\n/vault/locked\n');
    expect(result.stderr).toBe("find: '/vault/locked': Permission denied\n");
  });

  it('uses real error messages', () => {
    const shell = makeShell(fs);
    expect(shell.run('find ghost').stderr).toBe("find: 'ghost': No such file or directory\n");
    expect(shell.run('find . -size 1').stderr).toBe("find: unknown predicate '-size'\n");
    expect(shell.run('find . -name').stderr).toBe("find: missing argument to '-name'\n");
  });

  it('matches shell patterns', () => {
    expect(globToRegExp('*.txt').test('notes.txt')).toBe(true);
    expect(globToRegExp('file?.log').test('file1.log')).toBe(true);
    expect(globToRegExp('[!a]*').test('apple')).toBe(false);
  });
});
