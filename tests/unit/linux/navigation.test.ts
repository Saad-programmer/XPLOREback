import { describe, expect, it } from 'vitest';
import { HOME, makeShell, recordingShell } from './helpers';

const fs = {
  [HOME]: {
    'notes.txt': 'Nothing here. Or is there?',
    '.secret_scroll': 'k7Qx-PENGU-42',
    Archive: { type: 'dir' as const },
    zeta: { type: 'dir' as const },
  },
};

describe('pwd and cd', () => {
  it('starts in the home folder', () => {
    expect(makeShell(fs).run('pwd').stdout).toBe(`${HOME}\n`);
  });

  it('moves with relative, absolute, .. and ~ paths', () => {
    const shell = makeShell(fs);
    shell.run('cd Archive');
    expect(shell.cwd()).toBe(`${HOME}/Archive`);
    shell.run('cd ..');
    expect(shell.cwd()).toBe(HOME);
    shell.run('cd /');
    expect(shell.cwd()).toBe('/');
    shell.run('cd');
    expect(shell.cwd()).toBe(HOME);
    shell.run('cd /tmp/../home');
    shell.run('cd ~/zeta');
    expect(shell.cwd()).toBe(`${HOME}/zeta`);
  });

  it('emits cwd_changed', () => {
    const { shell, events } = recordingShell(fs);
    shell.run('cd Archive');
    expect(events).toContainEqual({ type: 'cwd_changed', from: HOME, to: `${HOME}/Archive` });
  });

  it('uses real error messages', () => {
    const shell = makeShell(fs);
    expect(shell.run('cd nowhere').stderr).toBe('cd: nowhere: No such file or directory\n');
    expect(shell.run('cd a b').stderr).toBe('cd: too many arguments\n');
    expect(shell.cwd()).toBe(HOME);
  });

  it('reacts when cd goes into a file', () => {
    const { shell, events } = recordingShell(fs);
    const result = shell.run('cd notes.txt');
    expect(result.stderr).toBe('cd: notes.txt: Not a directory\n');
    expect(events).toContainEqual({ type: 'special', kind: 'cd_into_file' });
  });
});

describe('ls', () => {
  it('hides dot files and sorts like Linux', () => {
    expect(makeShell(fs).run('ls').stdout).toBe('Archive  notes.txt  zeta\n');
  });

  it('prints one name per line into a pipe', () => {
    expect(makeShell(fs).run('ls | cat').stdout).toBe('Archive\nnotes.txt\nzeta\n');
  });

  it('shows hidden files, . and .. with -a', () => {
    expect(makeShell(fs).run('ls -a').stdout).toBe(
      '.  ..  Archive  notes.txt  .secret_scroll  zeta\n',
    );
    expect(makeShell(fs).run('ls -A').stdout).toBe('Archive  notes.txt  .secret_scroll  zeta\n');
  });

  it('prints details with -l', () => {
    const lines = makeShell(fs).run('ls -l').stdout.split('\n');
    expect(lines[0]).toBe('total 12');
    expect(lines[1]).toMatch(/^drwxr-xr-x 2 intern intern 4096 Sep {2}1 08:\d\d Archive$/);
    expect(lines[2]).toMatch(/^-rw-r--r-- 1 intern intern {3}27 Sep {2}1 08:\d\d notes\.txt$/);
  });

  it('accepts combined flags and lists files and folders', () => {
    const shell = makeShell(fs);
    expect(shell.run('ls -la').stdout).toContain('.secret_scroll');
    expect(shell.run('ls notes.txt').stdout).toBe('notes.txt\n');
    expect(shell.run('ls Archive zeta').stdout).toBe('Archive:\n\nzeta:\n');
  });

  it('uses real error messages', () => {
    const shell = makeShell(fs);
    const missing = shell.run('ls ghost');
    expect(missing.stderr).toBe("ls: cannot access 'ghost': No such file or directory\n");
    expect(missing.exitCode).toBe(2);
    expect(shell.run('ls -z').stderr).toBe(
      "ls: invalid option -- 'z'\nTry 'ls --help' for more information.\n",
    );
  });

  it('cannot open a folder without read permission', () => {
    const shell = makeShell({ '/vault': { box: { type: 'dir', mode: '711' } } });
    expect(shell.run('ls /vault/box').stderr).toBe(
      "ls: cannot open directory '/vault/box': Permission denied\n",
    );
  });
});

describe('clear', () => {
  it('emits clear', () => {
    const { shell, events } = recordingShell(fs);
    shell.run('clear');
    expect(events).toContainEqual({ type: 'clear' });
  });
});
