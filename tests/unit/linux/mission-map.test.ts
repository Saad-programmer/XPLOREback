import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { missions } from '@/src/games/linux/content';
import { isLocked, missionMap, missionStates } from '@/src/games/linux/mission-map';
import { GAMES } from '@/src/shared/games';
import { introSeen } from '@/src/shared/hub/intro';
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

const withDone = (...ids: string[]) => ({
  ...emptyProgress('linux'),
  missions: Object.fromEntries(ids.map((id) => [id, done])),
});

describe('mission map', () => {
  it('opens only the first mission for a new player', () => {
    const states = missionStates(missions, undefined);
    expect(states.map((s) => s.state)).toEqual(['open', ...missions.slice(1).map(() => 'locked')]);
    expect(states[0].current).toBe(true);
    expect(states[2].needs).toBe(missions[1]);
  });

  it('unlocks the next mission when one is done', () => {
    const states = missionStates(missions, withDone(missions[0].id));
    expect(states.map((s) => s.state)).toEqual([
      'done',
      'open',
      ...missions.slice(2).map(() => 'locked'),
    ]);
    expect(states[1].current).toBe(true);
    expect(states[0].result).toEqual(done);
  });

  it('groups missions by zone, keeping zones without missions yet', () => {
    const zones = missionMap(missions, undefined);
    expect(zones.map((z) => z.zone.id)).toEqual([
      'wake-up-room',
      'archive',
      'search-hall',
      'pipe-factory',
      'guarded-vault',
      'detective',
    ]);
    expect(zones[0].missions).toHaveLength(2);
    expect(zones[2].missions).toEqual([]);
  });

  it('blocks direct links to locked missions', () => {
    expect(isLocked(missions[2].id, missions, undefined)).toBe(true);
    expect(isLocked(missions[2].id, missions, withDone(missions[0].id, missions[1].id))).toBe(
      false,
    );
    expect(isLocked(missions[0].id, missions, undefined)).toBe(false);
  });
});

describe('Labs hub', () => {
  it('lists Linux as playable and the others as coming soon', () => {
    expect(GAMES.map((g) => [g.id, g.status])).toEqual([
      ['linux', 'play'],
      ['sql', 'soon'],
      ['git', 'soon'],
      ['network', 'soon'],
    ]);
    expect(GAMES.filter((g) => g.status === 'play').every((g) => g.href)).toBe(true);
  });

  it('ships only the intro video with sound', () => {
    expect(readdirSync(join(process.cwd(), 'public/intro'))).toEqual([
      'XploreLabs_Intro_16x9_sound.mp4',
    ]);
  });

  it('never forces the intro when storage is unavailable', () => {
    expect(introSeen()).toBe(true);
  });
});
