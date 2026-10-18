import { describe, expect, it } from 'vitest';
import { HOME, makeShell } from './helpers';

const access = [
  '10.0.0.5 GET /',
  '10.0.0.9 GET /admin',
  '10.0.0.5 GET /login',
  '192.168.1.2 GET /',
  '10.0.0.9 POST /admin',
  '10.0.0.5 GET /',
].join('\n');

const fs = {
  [HOME]: {
    'words.txt': 'pear\napple\nbanana\napple',
    'nums.txt': '10\n9\n100\n-1',
    'ips.txt': '10.0.0.5\n10.0.0.9\n10.0.0.5\n192.168.1.2\n10.0.0.9\n10.0.0.5',
    'access.log': access,
  },
};

describe('sort', () => {
  it('sorts text, numbers and reverses', () => {
    const shell = makeShell(fs);
    expect(shell.run('sort words.txt').stdout).toBe('apple\napple\nbanana\npear\n');
    expect(shell.run('sort nums.txt').stdout).toBe('-1\n10\n100\n9\n');
    expect(shell.run('sort -n nums.txt').stdout).toBe('-1\n9\n10\n100\n');
    expect(shell.run('sort -rn nums.txt').stdout).toBe('100\n10\n9\n-1\n');
    expect(shell.run('sort -u words.txt').stdout).toBe('apple\nbanana\npear\n');
  });
});

describe('uniq', () => {
  it('only merges lines next to each other', () => {
    expect(makeShell(fs).run('uniq words.txt').stdout).toBe('pear\napple\nbanana\napple\n');
  });

  it('counts with -c, padded like GNU uniq', () => {
    expect(makeShell(fs).run('sort ips.txt | uniq -c').stdout).toBe(
      '      3 10.0.0.5\n      2 10.0.0.9\n      1 192.168.1.2\n',
    );
  });
});

describe('mission 8: count the intruders', () => {
  it('counts unique IP addresses with a pipe', () => {
    const shell = makeShell(fs);
    expect(shell.run('sort ips.txt | uniq | wc -l').stdout).toBe('3\n');
  });

  it('finds the busiest IP', () => {
    const shell = makeShell({
      ...fs,
      [HOME]: { ...fs[HOME], 'ips2.txt': '1.1.1.1\n2.2.2.2\n2.2.2.2' },
    });
    expect(shell.run('sort ips2.txt | uniq -c | sort -rn | head -n 1').stdout).toBe(
      '      2 2.2.2.2\n',
    );
  });
});
