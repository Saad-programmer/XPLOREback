import { describe, expect, it } from 'vitest';
import { HOME, makeShell, recordingShell } from './helpers';

describe('unknown commands', () => {
  it('prints command not found with exit code 127', () => {
    const { shell, events } = recordingShell();
    const result = shell.run('dance --fast');
    expect(result.stderr).toBe('dance: command not found\n');
    expect(result.exitCode).toBe(127);
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'command', name: 'dance', errorKind: 'command_not_found' }),
    );
  });
});

describe('help, man and --help', () => {
  it('lists every command, in French too', () => {
    const shell = makeShell();
    const english = shell.run('help').stdout;
    expect(english).toContain('Commands available in this terminal:');
    for (const name of ['cd', 'grep', 'chmod', 'sl']) expect(english).toContain(`  ${name}`);
    shell.setLang('fr');
    expect(shell.run('help').stdout).toContain('Commandes disponibles');
  });

  it('shows a man page and prefers content pages', () => {
    expect(makeShell().run('man ls').stdout).toContain('SYNOPSIS\n       ls [-l] [-a]');
    expect(makeShell({}, { manPages: { ls: 'Custom page' } }).run('man ls').stdout).toBe(
      'Custom page\n',
    );
    expect(makeShell().run('man nope').stderr).toBe('No manual entry for nope\n');
  });

  it('prints usage for --help', () => {
    expect(makeShell().run('ls --help').stdout).toContain('Usage: ls');
  });
});

describe('history', () => {
  it('numbers the typed lines', () => {
    const shell = makeShell();
    shell.run('pwd');
    shell.run('');
    shell.run('ls');
    expect(shell.run('history').stdout).toBe('    1  pwd\n    2  ls\n    3  history\n');
  });
});

describe('joke commands', () => {
  it('emits sl, vim_trap, vi and exit events', () => {
    const { shell, events } = recordingShell();
    for (const line of ['sl', 'vim notes.txt', 'vi', 'exit']) shell.run(line);
    const kinds = events.flatMap((event) => (event.type === 'special' ? [event.kind] : []));
    expect(kinds).toEqual(['sl', 'vim_trap', 'vim_trap', 'exit']);
  });

  it('always refuses sudo, and detects sudo spam', () => {
    const { shell, events } = recordingShell();
    const result = shell.run('sudo ls');
    expect(result.stderr).toBe(
      'intern is not in the sudoers file.  This incident will be reported.\n',
    );
    expect(result.exitCode).toBe(1);
    shell.run('sudo rm x');
    shell.run('sudo cat y');
    const kinds = events.flatMap((event) => (event.type === 'special' ? [event.kind] : []));
    expect(kinds).toEqual(['sudo', 'sudo', 'sudo', 'sudo_spam']);
  });

  it('resets the sudo streak after another command', () => {
    const { shell, events } = recordingShell();
    for (const line of ['sudo a', 'sudo b', 'pwd', 'sudo c']) shell.run(line);
    expect(events).not.toContainEqual({ type: 'special', kind: 'sudo_spam' });
  });
});

describe('command event', () => {
  it('describes the whole line', () => {
    const { shell, events } = recordingShell({ [HOME]: { 'a.txt': 'x' } });
    shell.run('cat a.txt | sort | uniq > out.txt');
    expect(events.at(-1)).toEqual({
      type: 'command',
      raw: 'cat a.txt | sort | uniq > out.txt',
      name: 'cat',
      names: ['cat', 'sort', 'uniq'],
      args: ['a.txt'],
      exitCode: 0,
      errorKind: undefined,
      pipeLength: 3,
      redirect: '>',
    });
  });

  it('reports syntax errors', () => {
    const { shell, events } = recordingShell();
    const result = shell.run('ls |');
    expect(result.exitCode).toBe(2);
    expect(events.at(-1)).toMatchObject({ type: 'command', errorKind: 'syntax' });
  });
});
