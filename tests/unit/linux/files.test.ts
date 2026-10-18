import { describe, expect, it } from 'vitest';
import { HOME, makeShell, recordingShell } from './helpers';

const fs = {
  [HOME]: {
    'a.txt': 'A',
    'b.txt': 'B',
    box: { type: 'dir' as const, children: { 'inside.txt': 'in' } },
  },
};

describe('mkdir and touch', () => {
  it('creates folders and files and emits events', () => {
    const { shell, events } = recordingShell(fs);
    shell.run('mkdir -p x/y');
    shell.run('touch x/y/new.txt');
    expect(shell.vfs.stat(`${HOME}/x/y/new.txt`)?.type).toBe('file');
    expect(events).toContainEqual({
      type: 'fs_changed',
      change: 'create',
      path: `${HOME}/x`,
      nodeType: 'dir',
    });
    expect(events).toContainEqual({
      type: 'fs_changed',
      change: 'create',
      path: `${HOME}/x/y/new.txt`,
      nodeType: 'file',
    });
  });

  it('uses real error messages', () => {
    const shell = makeShell(fs);
    expect(shell.run('mkdir box').stderr).toBe(
      "mkdir: cannot create directory 'box': File exists\n",
    );
    expect(shell.run('mkdir a/b/c').stderr).toBe(
      "mkdir: cannot create directory 'a/b/c': No such file or directory\n",
    );
    expect(shell.run('mkdir a.txt/x').stderr).toBe(
      "mkdir: cannot create directory 'a.txt/x': Not a directory\n",
    );
    expect(shell.run('mkdir').stderr).toContain('mkdir: missing operand');
    expect(shell.run('touch /etc/x').stderr).toBe(
      "touch: cannot touch '/etc/x': No such file or directory\n",
    );
  });
});

describe('cp', () => {
  it('copies a file, into a folder too', () => {
    const shell = makeShell(fs);
    shell.run('cp a.txt c.txt');
    shell.run('cp a.txt b.txt box');
    expect(shell.run('cat c.txt box/a.txt box/b.txt').stdout).toBe('A\nA\nB\n');
  });

  it('needs -r for folders', () => {
    const shell = makeShell(fs);
    expect(shell.run('cp box copy').stderr).toBe(
      "cp: -r not specified; omitting directory 'box'\n",
    );
    shell.run('cp -r box copy');
    expect(shell.run('cat copy/inside.txt').stdout).toBe('in\n');
  });

  it('refuses bad targets', () => {
    const shell = makeShell(fs);
    expect(shell.run('cp a.txt b.txt c.txt').stderr).toBe(
      "cp: target 'c.txt' is not a directory\n",
    );
    expect(shell.run('cp ghost x').stderr).toBe(
      "cp: cannot stat 'ghost': No such file or directory\n",
    );
    expect(shell.run('cp a.txt a.txt').stderr).toBe("cp: 'a.txt' and 'a.txt' are the same file\n");
    expect(shell.run('cp -r box box/deeper').stderr).toBe(
      "cp: cannot copy a directory, 'box', into itself, 'box/deeper'\n",
    );
  });
});

describe('mv', () => {
  it('renames and moves into folders, with a move event', () => {
    const { shell, events } = recordingShell(fs);
    shell.run('mv a.txt renamed.txt');
    shell.run('mv renamed.txt box');
    expect(shell.run('ls box').stdout).toBe('inside.txt  renamed.txt\n');
    expect(events).toContainEqual({
      type: 'fs_changed',
      change: 'move',
      path: `${HOME}/renamed.txt`,
      to: `${HOME}/box/renamed.txt`,
      nodeType: 'file',
    });
  });

  it('refuses to move a folder inside itself', () => {
    expect(makeShell(fs).run('mv box box/sub').stderr).toBe(
      "mv: cannot move 'box' to a subdirectory of itself, 'box/sub'\n",
    );
  });
});

describe('rm', () => {
  it('deletes files and emits delete', () => {
    const { shell, events } = recordingShell(fs);
    shell.run('rm a.txt');
    expect(shell.vfs.stat(`${HOME}/a.txt`)).toBeNull();
    expect(events).toContainEqual({
      type: 'fs_changed',
      change: 'delete',
      path: `${HOME}/a.txt`,
      nodeType: 'file',
    });
  });

  it('needs -r for folders, -f ignores missing files', () => {
    const shell = makeShell(fs);
    expect(shell.run('rm box').stderr).toBe("rm: cannot remove 'box': Is a directory\n");
    expect(shell.run('rm ghost').stderr).toBe(
      "rm: cannot remove 'ghost': No such file or directory\n",
    );
    expect(shell.run('rm -f ghost').exitCode).toBe(0);
    expect(shell.run('rm -rf box').exitCode).toBe(0);
    expect(shell.vfs.stat(`${HOME}/box`)).toBeNull();
  });

  it('refuses . and ..', () => {
    expect(makeShell(fs).run('rm -r ..').stderr).toBe(
      "rm: refusing to remove '.' or '..' directory: skipping '..'\n",
    );
  });

  it('stops rm -rf / with the real failsafe and a special event', () => {
    const { shell, events } = recordingShell(fs);
    const result = shell.run('rm -rf /');
    expect(result.stderr).toBe(
      "rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe\n",
    );
    expect(events).toContainEqual({ type: 'special', kind: 'rm_rf_root' });
    expect(shell.vfs.stat(HOME)).not.toBeNull();
  });

  it('cannot delete in a folder owned by root', () => {
    const shell = makeShell({ '/etc': { passwd: 'root:x' } });
    expect(shell.run('rm /etc/passwd').stderr).toBe(
      "rm: cannot remove '/etc/passwd': Permission denied\n",
    );
  });
});
