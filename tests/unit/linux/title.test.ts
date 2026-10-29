import { describe, expect, it } from 'vitest';
import { missions } from '@/src/games/linux/content';
import { consumeFreshStart, titleMenu } from '@/src/games/linux/title';
import { emptyProgress, type MissionResult } from '@/src/shared/bridge/types';
import { createRng } from '@/src/shared/random';

const done: MissionResult = {
  status: 'done',
  bestScore: 15,
  hintsUsed: 0,
  attempts: 1,
  bestTimeS: 60,
  shortestCmdLen: null,
  firstCompletedAt: '2026-10-18T10:00:00.000Z',
};

describe('seeded random generator', () => {
  it('gives the same numbers for the same seed', () => {
    const a = createRng(7);
    const b = createRng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(createRng(8)()).not.toBe(createRng(7)());
  });
});

describe('title menu', () => {
  it('offers Start only for a new player', () => {
    expect(titleMenu(missions, undefined)).toEqual({
      hasProgress: false,
      continueTo: missions[0],
      finished: false,
    });
  });

  it('continues the mission in progress', () => {
    const progress = { ...emptyProgress('linux'), currentMissionId: missions[1].id };
    expect(titleMenu(missions, progress)).toMatchObject({
      hasProgress: true,
      continueTo: missions[1],
    });
  });

  it('skips to the first mission not done when the current one is finished', () => {
    const progress = {
      ...emptyProgress('linux'),
      currentMissionId: missions[0].id,
      missions: { [missions[0].id]: done },
    };
    expect(titleMenu(missions, progress).continueTo).toBe(missions[1]);
  });

  it('knows when every mission is done', () => {
    const all = Object.fromEntries(missions.map((m) => [m.id, done]));
    const menu = titleMenu(missions, { ...emptyProgress('linux'), missions: all });
    expect(menu).toMatchObject({ finished: true, continueTo: missions[missions.length - 1] });
  });

  it('ignores fresh starts when storage is unavailable', () => {
    expect(consumeFreshStart('x')).toBe(false);
  });
});
