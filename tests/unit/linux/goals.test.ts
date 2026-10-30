import { describe, expect, it } from 'vitest';
import type { Goal } from '@/src/games/linux/engine/goals';
import { HOME, recordingShell } from './helpers';

const fs = {
  [HOME]: {
    'notes.txt': 'Nothing here.',
    '.secret_scroll': '{{password}}',
    'secret.txt': { content: 'x', mode: '000' },
    'log.txt': 'a\nb',
    room: { type: 'dir' as const },
  },
};

function goalShell(goal: Goal) {
  return recordingShell(fs, { goal, missionId: 'test', secrets: { password: 'k7Qx-PENGU-42' } });
}

const reached = (events: { type: string }[]) => events.filter((e) => e.type === 'goal_reached');

describe('goal checker', () => {
  it('password: mission 3, the hidden scroll', () => {
    const { shell, events } = goalShell({ type: 'password', value: '{{password}}' });
    shell.run('ls -a');
    const password = shell.run('cat .secret_scroll').stdout.trim();
    expect(shell.submitAnswer('wrong')).toEqual({ correct: false, goalReached: false });
    expect(shell.submitAnswer(` ${password} `)).toEqual({ correct: true, goalReached: true });
    expect(reached(events)).toEqual([{ type: 'goal_reached', missionId: 'test' }]);
  });

  it('cwd', () => {
    const { shell } = goalShell({ type: 'cwd', path: 'room' });
    expect(shell.run('pwd').goalReached).toBe(false);
    expect(shell.run('cd room').goalReached).toBe(true);
  });

  it('file_exists with a node type', () => {
    const { shell } = goalShell({ type: 'file_exists', path: '~/archive/2024', nodeType: 'dir' });
    shell.run('touch archive');
    expect(shell.isGoalReached()).toBe(false);
    shell.run('rm archive');
    shell.run('mkdir -p archive/2024');
    expect(shell.isGoalReached()).toBe(true);
  });

  it('file_absent: the file must be deleted', () => {
    const { shell } = goalShell({ type: 'file_absent', path: '~/notes.txt' });
    expect(shell.isGoalReached()).toBe(false);
    shell.run('mv notes.txt room/');
    expect(shell.isGoalReached()).toBe(true);
    const deleted = goalShell({ type: 'file_absent', path: 'log.txt' }).shell;
    expect(deleted.run('rm log.txt').goalReached).toBe(true);
  });

  it('file_content: equals and contains', () => {
    const { shell } = goalShell({ type: 'file_content', path: 'evidence.txt', contains: 'b' });
    shell.run('grep a log.txt > evidence.txt');
    expect(shell.isGoalReached()).toBe(false);
    shell.run('grep b log.txt >> evidence.txt');
    expect(shell.isGoalReached()).toBe(true);

    const exact = goalShell({ type: 'file_content', path: 'copy.txt', equals: 'a\nb' }).shell;
    exact.run('cp log.txt copy.txt');
    expect(exact.isGoalReached()).toBe(true);
  });

  it('permission', () => {
    const { shell } = goalShell({ type: 'permission', path: 'secret.txt', mode: '400' });
    shell.run('chmod 600 secret.txt');
    expect(shell.isGoalReached()).toBe(false);
    shell.run('chmod 400 secret.txt');
    expect(shell.isGoalReached()).toBe(true);
  });

  it('command_used needs a successful line', () => {
    const { shell } = goalShell({ type: 'command_used', name: 'wc', minPipeLength: 2 });
    shell.run('wc -l log.txt');
    expect(shell.isGoalReached()).toBe(false);
    shell.run('cat ghost | wc -l');
    expect(shell.isGoalReached()).toBe(true);
  });

  it('all: every inner goal, password included', () => {
    const { shell, events } = goalShell({
      type: 'all',
      goals: [
        { type: 'cwd', path: 'room' },
        { type: 'password', value: '{{password}}' },
      ],
    });
    expect(shell.submitAnswer('k7Qx-PENGU-42')).toEqual({ correct: true, goalReached: false });
    shell.run('cd room');
    expect(shell.isGoalReached()).toBe(true);
    shell.run('cd ..');
    shell.run('cd room');
    expect(reached(events)).toHaveLength(1);
  });
});
