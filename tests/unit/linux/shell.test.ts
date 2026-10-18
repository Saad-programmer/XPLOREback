import { describe, expect, it } from 'vitest';
import { createShell } from '@/src/games/linux/engine/shell';
import { HOME, makeShell, recordingShell } from './helpers';

const fs = { [HOME]: { 'log.txt': 'ok\nERROR one\nok\nERROR two' } };

describe('redirections', () => {
  it('writes with > and appends with >>', () => {
    const shell = makeShell(fs);
    shell.run('grep ERROR log.txt > errors.txt');
    expect(shell.run('cat errors.txt').stdout).toBe('ERROR one\nERROR two\n');
    shell.run('echo done >> errors.txt');
    expect(shell.run('cat errors.txt').stdout).toBe('ERROR one\nERROR two\ndone\n');
    shell.run('echo fresh > errors.txt');
    expect(shell.run('cat errors.txt').stdout).toBe('fresh\n');
  });

  it('prints nothing on screen and emits create + modify', () => {
    const { shell, events } = recordingShell(fs);
    const result = shell.run('echo hi > note.txt');
    expect(result.stdout).toBe('');
    expect(events).toContainEqual({
      type: 'fs_changed',
      change: 'create',
      path: `${HOME}/note.txt`,
      nodeType: 'file',
    });
    expect(events).toContainEqual({
      type: 'fs_changed',
      change: 'modify',
      path: `${HOME}/note.txt`,
      nodeType: 'file',
    });
  });

  it('opens the file before running, like bash', () => {
    const shell = makeShell(fs);
    shell.run('ls > list.txt');
    expect(shell.run('cat list.txt').stdout).toBe('list.txt\nlog.txt\n');
  });

  it('still shows errors and refuses forbidden places', () => {
    const shell = makeShell(fs);
    const result = shell.run('cat ghost > out.txt');
    expect(result.stderr).toBe('cat: ghost: No such file or directory\n');
    expect(shell.run('echo x > /etc/x').stderr).toBe('bash: /etc/x: No such file or directory\n');
    expect(makeShell({ '/etc': {} }).run('echo x > /etc/x').stderr).toBe(
      'bash: /etc/x: Permission denied\n',
    );
  });
});

describe('pipes', () => {
  it('uses the exit code of the last command and keeps the first error', () => {
    const { shell, events } = recordingShell(fs);
    const result = shell.run('cat ghost | wc -l');
    expect(result.stdout).toBe('0\n');
    expect(result.exitCode).toBe(0);
    expect(events.at(-1)).toMatchObject({ type: 'command', errorKind: 'not_found' });
  });
});

describe('snapshot and restore', () => {
  it('continues where the player stopped', () => {
    const shell = makeShell(fs);
    shell.run('mkdir work');
    shell.run('cd work');
    shell.run('echo saved > state.txt');
    const snapshot = JSON.parse(JSON.stringify(shell.snapshot()));

    const restored = createShell({ filesystem: {}, startDir: '~', restore: snapshot });
    expect(restored.cwd()).toBe(`${HOME}/work`);
    expect(restored.run('cat state.txt').stdout).toBe('saved\n');
    expect(restored.history()).toEqual([
      'mkdir work',
      'cd work',
      'echo saved > state.txt',
      'cat state.txt',
    ]);
  });
});

describe('secrets', () => {
  it('fills {{password}} in files', () => {
    const shell = makeShell(
      { [HOME]: { '.secret_scroll': '{{password}}' } },
      { secrets: { password: 'k7Qx-PENGU-42' } },
    );
    expect(shell.run('cat .secret_scroll').stdout).toBe('k7Qx-PENGU-42\n');
  });

  it('exposes command names for Tab completion', () => {
    expect(makeShell().commandNames()).toEqual(expect.arrayContaining(['cd', 'ls', 'vi', 'vim']));
  });
});
