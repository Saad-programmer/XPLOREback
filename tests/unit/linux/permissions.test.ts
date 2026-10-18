import { describe, expect, it } from 'vitest';
import { applyMode } from '@/src/games/linux/engine/commands/chmod';
import { HOME, makeShell, recordingShell } from './helpers';

const fs = {
  [HOME]: {
    'secret.txt': { content: 'opened', mode: '000' },
    'script.sh': 'echo hi',
  },
  '/etc': { shadow: { content: 'nope', mode: '600' } },
};

describe('whoami', () => {
  it('prints the user name', () => {
    expect(makeShell(fs).run('whoami').stdout).toBe('intern\n');
  });
});

describe('chmod', () => {
  it('applies numeric and symbolic modes', () => {
    expect(applyMode('640', 0)).toBe(0o640);
    expect(applyMode('u+x', 0o644)).toBe(0o744);
    expect(applyMode('go-r', 0o644)).toBe(0o600);
    expect(applyMode('a=r', 0o777)).toBe(0o444);
    expect(applyMode('+x', 0o644)).toBe(0o755);
    expect(applyMode('u+r,g+w', 0)).toBe(0o420);
    expect(applyMode('bad', 0)).toBeNull();
  });

  it('mission 10: read a protected file after chmod', () => {
    const { shell, events } = recordingShell(fs);
    expect(shell.run('cat secret.txt').stderr).toBe('cat: secret.txt: Permission denied\n');
    shell.run('chmod u+r secret.txt');
    expect(shell.run('cat secret.txt').stdout).toBe('opened\n');
    expect(events).toContainEqual({
      type: 'fs_changed',
      change: 'chmod',
      path: `${HOME}/secret.txt`,
      nodeType: 'file',
    });
  });

  it('shows the new mode in ls -l', () => {
    const shell = makeShell(fs);
    shell.run('chmod 755 script.sh');
    expect(shell.run('ls -l script.sh').stdout).toMatch(/^-rwxr-xr-x /);
  });

  it('accepts a mode that looks like an option', () => {
    const shell = makeShell(fs);
    shell.run('chmod -r script.sh');
    expect(shell.vfs.stat(`${HOME}/script.sh`)?.mode).toBe(0o200);
  });

  it('uses real error messages', () => {
    const shell = makeShell(fs);
    expect(shell.run('chmod 644 /etc/shadow').stderr).toBe(
      "chmod: changing permissions of '/etc/shadow': Operation not permitted\n",
    );
    expect(shell.run('chmod 644 ghost').stderr).toBe(
      "chmod: cannot access 'ghost': No such file or directory\n",
    );
    expect(shell.run('chmod zz script.sh').stderr).toContain("chmod: invalid mode: 'zz'");
    expect(shell.run('chmod 644').stderr).toContain("chmod: missing operand after '644'");
  });
});
