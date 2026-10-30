import { describe, expect, it } from 'vitest';
import { missions } from '@/src/games/linux/content';
import {
  LAYOUTS,
  NODE_SPOTS,
  routeOf,
  segmentPath,
  segmentsOf,
  starsOf,
  type LayoutName,
} from '@/src/games/linux/map-layout';
import { ZONE_IDS } from '@/src/games/linux/meta';
import { missionMap } from '@/src/games/linux/mission-map';
import { emptyProgress, type MissionResult } from '@/src/shared/bridge/types';

const LAYOUT_NAMES: LayoutName[] = ['wide', 'tall'];

const done = (hintsUsed: number): MissionResult => ({
  status: 'done',
  bestScore: 15,
  hintsUsed,
  attempts: 1,
  bestTimeS: 60,
  shortestCmdLen: null,
  firstCompletedAt: '2026-10-18T10:00:00.000Z',
});

describe('mission map layout', () => {
  it('places every island inside the scene, without overlaps', () => {
    for (const name of LAYOUT_NAMES) {
      const { width, height, islands } = LAYOUTS[name];
      const places = ZONE_IDS.map((zone) => islands[zone]);
      for (const island of places) {
        expect(island.x - island.size / 2).toBeGreaterThanOrEqual(0);
        expect(island.x + island.size / 2).toBeLessThanOrEqual(width);
        expect(island.y - island.size / 2).toBeGreaterThanOrEqual(0);
        expect(island.y + island.size / 2).toBeLessThanOrEqual(height);
      }
      for (const [i, a] of places.entries())
        for (const b of places.slice(i + 1)) {
          // Square images with transparent corners: the islands themselves must not touch.
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(((a.size + b.size) / 2) * 0.75);
        }
    }
  });

  it('has a free spot for every mission the PRD plans per zone', () => {
    const planned = {
      'wake-up-room': 2,
      archive: 3,
      'search-hall': 2,
      'pipe-factory': 2,
      'guarded-vault': 1,
      detective: 1,
    };
    for (const zone of ZONE_IDS) expect(NODE_SPOTS[zone].length).toBe(planned[zone]);
    for (const zone of ZONE_IDS) {
      const count = missions.filter((m) => m.zone === zone).length;
      expect(count).toBeLessThanOrEqual(NODE_SPOTS[zone].length);
    }
  });

  it('routes through every mission in order, and every island', () => {
    const route = routeOf(missionMap(missions, undefined));
    const stops = route.filter((s) => s.kind === 'mission').map((s) => s.entry!.mission.id);
    expect(stops).toEqual(missions.map((m) => m.id));
    expect(new Set(route.map((s) => s.zone))).toEqual(new Set(ZONE_IDS));
  });

  it('lights the travelled path and the way to the next mission only', () => {
    const progress = emptyProgress('linux');
    progress.missions[missions[0].id] = done(0);
    const segments = segmentsOf(routeOf(missionMap(missions, progress)));
    expect(segments[0].state).toBe('open'); // mission 1 -> mission 2, now open
    expect(segments[1].state).toBe('locked');
    expect(segments.at(-1)!.bonus).toBe(true);
  });

  it('draws curves along the layout flow', () => {
    expect(segmentPath('wide', { x: 0, y: 0 }, { x: 100, y: 50 })).toBe('M0 0C50 0 50 50 100 50');
    expect(segmentPath('tall', { x: 0, y: 0 }, { x: 100, y: 50 })).toBe('M0 0C0 25 100 25 100 50');
  });

  it('gives stars from the hints used', () => {
    expect([null, done(0), done(1), done(4)].map(starsOf)).toEqual([0, 3, 2, 1]);
  });
});
