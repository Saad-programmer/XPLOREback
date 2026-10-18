import { describe, expect, it } from 'vitest';
import { missions } from '@/src/games/linux/content';
import {
  createRng,
  cursorPulse,
  DEFAULT_GALAXY,
  generateGalaxy,
  generateStarLayers,
} from '@/src/games/linux/galaxy';
import { consumeFreshStart, titleMenu } from '@/src/games/linux/title';
import { emptyProgress, type MissionResult } from '@/src/shared/bridge/types';

const done: MissionResult = {
  status: 'done',
  bestScore: 15,
  hintsUsed: 0,
  attempts: 1,
  bestTimeS: 60,
  shortestCmdLen: null,
  firstCompletedAt: '2026-10-18T10:00:00.000Z',
};

describe('galaxy', () => {
  it('is the same on every visit (seeded)', () => {
    expect(generateGalaxy()).toEqual(generateGalaxy());
    expect(generateStarLayers(1)).toEqual(generateStarLayers(1));
    expect(generateGalaxy({ ...DEFAULT_GALAXY, seed: 2 })).not.toEqual(generateGalaxy());
  });

  it('keeps every particle inside the disc with valid colours', () => {
    const particles = generateGalaxy();
    expect(particles).toHaveLength(DEFAULT_GALAXY.count);
    for (const p of particles) {
      expect(Math.hypot(p.x, p.y)).toBeLessThan(1.25);
      expect(p.alpha).toBeGreaterThan(0);
      expect(p.alpha).toBeLessThanOrEqual(1);
      expect(p.color.every((c) => Number.isInteger(c) && c >= 0 && c <= 255)).toBe(true);
    }
  });

  it('has 3 star layers, the nearest moving most', () => {
    const layers = generateStarLayers(DEFAULT_GALAXY.seed);
    expect(layers.map((l) => l.depth)).toEqual(
      [...layers.map((l) => l.depth)].sort((a, b) => a - b),
    );
    expect(layers).toHaveLength(3);
  });

  it('uses a stable random generator and a cursor-tempo pulse', () => {
    const a = createRng(7);
    const b = createRng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(cursorPulse(0)).toBeCloseTo(1);
    expect(cursorPulse(0.53)).toBeCloseTo(0);
    expect(cursorPulse(1.06)).toBeCloseTo(1);
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
