import type { GameProgress, MissionResult } from '@/src/shared/bridge/types';
import type { Mission } from './content/schema';
import { ZONES, type Zone } from './meta';

export type MissionState = 'done' | 'open' | 'locked';

export interface MapMission {
  mission: Mission;
  state: MissionState;
  /** The mission "Continue" would open. */
  current: boolean;
  result: MissionResult | null;
  /** Mission to finish first, for locked missions. */
  needs: Mission | null;
}

export interface MapZone {
  zone: Zone;
  missions: MapMission[];
}

/**
 * A mission opens when the one before it in the campaign is done (PRD section 5:
 * "The next mission unlocks"). Missions already done stay replayable.
 */
export function missionStates(
  missions: readonly Mission[],
  progress: GameProgress | undefined,
): MapMission[] {
  const results = progress?.missions ?? {};
  const firstOpen = missions.find((m) => !results[m.id]);
  return missions.map((mission, index) => {
    const result = results[mission.id] ?? null;
    const previous = index > 0 ? missions[index - 1] : null;
    const unlocked = !previous || !!results[previous.id];
    return {
      mission,
      state: result ? 'done' : unlocked ? 'open' : 'locked',
      current: mission === firstOpen,
      result,
      needs: !result && !unlocked ? previous : null,
    };
  });
}

/** Missions grouped by zone, in zone order. Zones without missions yet are included. */
export function missionMap(
  missions: readonly Mission[],
  progress: GameProgress | undefined,
): MapZone[] {
  const states = missionStates(missions, progress);
  return ZONES.map((zone) => ({
    zone,
    missions: states.filter((entry) => entry.mission.zone === zone.id),
  }));
}

export function isLocked(
  missionId: string,
  missions: readonly Mission[],
  progress: GameProgress | undefined,
): boolean {
  return (
    missionStates(missions, progress).find((m) => m.mission.id === missionId)?.state === 'locked'
  );
}
