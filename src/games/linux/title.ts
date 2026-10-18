import type { GameProgress } from '@/src/shared/bridge/types';
import type { Mission } from './content/schema';

export interface TitleMenu {
  /** The player has started or finished at least one mission. */
  hasProgress: boolean;
  /** Where "Continue" goes: the mission in progress, else the first one not done. */
  continueTo: Mission;
  /** Every mission is done. */
  finished: boolean;
}

export function titleMenu(
  missions: readonly Mission[],
  progress: GameProgress | undefined,
): TitleMenu {
  const done = new Set(Object.keys(progress?.missions ?? {}));
  const current = missions.find((m) => m.id === progress?.currentMissionId);
  const firstOpen = missions.find((m) => !done.has(m.id));
  const continueTo =
    (current && !done.has(current.id) ? current : firstOpen) ?? missions[missions.length - 1];
  return {
    hasProgress: done.size > 0 || !!progress?.currentMissionId,
    continueTo,
    finished: !firstOpen,
  };
}

const FRESH_START_KEY = 'labs:linux:fresh-start';

/** "New game": the next visit to this mission ignores its saved checkpoint. */
export function requestFreshStart(missionId: string): void {
  try {
    sessionStorage.setItem(FRESH_START_KEY, missionId);
  } catch {
    // Storage blocked: the mission simply restores its checkpoint.
  }
}

/** True once if a fresh start was requested for this mission. */
export function consumeFreshStart(missionId: string): boolean {
  try {
    if (sessionStorage.getItem(FRESH_START_KEY) !== missionId) return false;
    sessionStorage.removeItem(FRESH_START_KEY);
    return true;
  } catch {
    return false;
  }
}
