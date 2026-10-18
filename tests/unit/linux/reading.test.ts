import { describe, expect, it } from 'vitest';
import { HOME, makeShell } from './helpers';

const numbers = Array.from({ length: 15 }, (_, i) => `line ${i + 1}`).join('\n');
const fs = {
  [HOME]: {
    'a.txt': 'alpha\nbeta',
    'b.txt': 'gamma',
    'log.txt': numbers,
    docs: { type: 'dir' as const },
  },
};

describe('cat', () => {
  it('prints and joins files', () => {
    const shell = makeShell(fs);
    expect(shell.run('cat a.txt').stdout).toBe('alpha\nbeta\n');
    expect(shell.run('cat a.txt b.txt').stdout).toBe('alpha\nbeta\ngamma\n');
  });

  it('reads standard input in a pipe', () => {
    expect(makeShell(fs).run('echo hi | cat').stdout).toBe('hi\n');
  });

  it('keeps going after an error', () => {
    const result = makeShell(fs).run('cat a.txt ghost b.txt');
    expect(result.stdout).toBe('alpha\nbeta\ngamma\n');
    expect(result.stderr).toBe('cat: ghost: No such file or directory\n');
    expect(result.exitCode).toBe(1);
  });

  it('refuses folders', () => {
    expect(makeShell(fs).run('cat docs').stderr).toBe('cat: docs: Is a directory\n');
  });
});

describe('head and tail', () => {
  it('shows 10 lines by default', () => {
    const shell = makeShell(fs);
    expect(shell.run('head log.txt').stdout.split('\n')).toHaveLength(11);
    expect(shell.run('tail log.txt').stdout.startsWith('line 6\n')).toBe(true);
  });

  it('accepts -n N, -nN and -N', () => {
    const shell = makeShell(fs);
    expect(shell.run('head -n 2 log.txt').stdout).toBe('line 1\nline 2\n');
    expect(shell.run('head -n2 log.txt').stdout).toBe('line 1\nline 2\n');
    expect(shell.run('tail -3 log.txt').stdout).toBe('line 13\nline 14\nline 15\n');
    expect(shell.run('tail -n 0 log.txt').stdout).toBe('');
  });

  it('prints headers for several files', () => {
    expect(makeShell(fs).run('head -n 1 a.txt b.txt').stdout).toBe(
      '==> a.txt <==\nalpha\n\n==> b.txt <==\ngamma\n',
    );
  });

  it('uses real error messages', () => {
    const shell = makeShell(fs);
    expect(shell.run('head ghost').stderr).toBe(
      "head: cannot open 'ghost' for reading: No such file or directory\n",
    );
    expect(shell.run('tail -n x a.txt').stderr).toBe("tail: invalid number of lines: 'x'\n");
  });
});

describe('wc', () => {
  it('counts like GNU wc', () => {
    const shell = makeShell(fs);
    // GNU pads every column to the width of the biggest number.
    expect(shell.run('wc a.txt').stdout).toBe(' 2  2 11 a.txt\n');
    expect(shell.run('wc -l a.txt').stdout).toBe('2 a.txt\n');
    expect(shell.run('wc -l a.txt b.txt').stdout).toBe('2 a.txt\n1 b.txt\n3 total\n');
  });

  it('prints a bare number for wc -l in a pipe', () => {
    expect(makeShell(fs).run('cat log.txt | wc -l').stdout).toBe('15\n');
  });

  it('pads standard input like GNU wc', () => {
    expect(makeShell(fs).run('echo hi there | wc').stdout).toBe('      1       2       9\n');
  });
});

describe('echo', () => {
  it('prints its arguments', () => {
    const shell = makeShell(fs);
    expect(shell.run('echo hello   world').stdout).toBe('hello world\n');
    expect(shell.run('echo -n hi').stdout).toBe('hi');
    expect(shell.run('echo --help').stdout).toBe('--help\n');
  });
});
