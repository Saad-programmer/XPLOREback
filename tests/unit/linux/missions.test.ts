import { describe, expect, it } from 'vitest';
import { getMission, missions, nextMission } from '@/src/games/linux/content';
import { createMissionShell, toCheckpoint } from '@/src/games/linux/session';
import { MockBridge } from '@/src/shared/bridge/mock-bridge';
import { memoryStore } from '@/src/shared/storage';

const STATS = { hintsUsed: 0, attempts: 3, timeS: 90, shortestCmdLen: 2 };

describe('content bundle', () => {
  it('lists missions in campaign order', () => {
    expect(missions.slice(0, 3).map((m) => m.id)).toEqual([
      'wake-up-hello-world',
      'wake-up-first-door',
      'archive-hidden-scroll',
    ]);
    expect(nextMission('wake-up-hello-world')?.id).toBe('wake-up-first-door');
    expect(getMission('nope')).toBeUndefined();
  });
});

describe.each(['wake-up-hello-world', 'wake-up-first-door', 'archive-hidden-scroll'])(
  'mission %s, played end to end with the mock bridge',
  (id) => {
    const mission = getMission(id)!;

    it('is solved with the personal password and gives points once', async () => {
      const bridge = new MockBridge(memoryStore());
      const start = await bridge.startMission('linux', id);
      const { shell } = createMissionShell(mission, start, 'en');

      let output = '';
      for (const line of mission.solution) output += shell.run(line).stdout;
      expect(output).toContain(start.secrets.password);

      expect(shell.submitAnswer('not-the-password').correct).toBe(false);
      expect(shell.submitAnswer(start.secrets.password)).toEqual({
        correct: true,
        goalReached: true,
      });

      const result = await bridge.submitMission('linux', id, start.secrets.password, STATS);
      expect(result).toMatchObject({ success: true, pointsAwarded: 15, firstCompletion: true });
    });

    it('refuses the password of another player', async () => {
      const ali = new MockBridge(memoryStore());
      const { secrets } = await ali.startMission('linux', id);
      const saraStore = memoryStore();
      saraStore.set('labs:mock:player', JSON.stringify({ id: 'sara', name: 'Sara', points: 0 }));
      const sara = new MockBridge(saraStore);
      expect((await sara.submitMission('linux', id, secrets.password, STATS)).success).toBe(false);
    });
  },
);

describe('checkpoints', () => {
  it('restore the file system, folder, history and stats', async () => {
    const mission = getMission('wake-up-first-door')!;
    const bridge = new MockBridge(memoryStore());
    const first = createMissionShell(mission, await bridge.startMission('linux', mission.id), 'en');
    first.shell.run('cd door-2');
    first.shell.run('touch was-here.txt');
    await bridge.saveCheckpoint(
      toCheckpoint(first.shell, mission, { ...first.meta, hintsUsed: 1, attempts: 2 }),
    );

    const again = createMissionShell(mission, await bridge.startMission('linux', mission.id), 'fr');
    expect(again.restored).toBe(true);
    expect(again.shell.cwd()).toBe('/home/intern/door-2');
    expect(again.shell.run('ls').stdout).toBe('note.txt  was-here.txt\n');
    expect(again.shell.history()).toContain('touch was-here.txt');
    expect(again.meta).toMatchObject({ hintsUsed: 1, attempts: 2 });
  });

  it('ignore a checkpoint that is not a shell snapshot', () => {
    const mission = getMission('wake-up-hello-world')!;
    const { restored, shell } = createMissionShell(
      mission,
      {
        missionId: mission.id,
        secrets: { password: 'x' },
        checkpoint: {
          game: 'linux',
          missionId: mission.id,
          state: { broken: true },
          hintsUsed: 0,
          attempts: 0,
          startedAt: '',
          updatedAt: '',
        },
      },
      'en',
    );
    expect(restored).toBe(false);
    expect(shell.cwd()).toBe('/home/intern');
  });
});
