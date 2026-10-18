import type { Checkpoint, MissionStart } from '@/src/shared/bridge/types';
import type { Lang } from '@/src/shared/i18n/text';
import type { Mission } from './content/schema';
import { createShell, type Shell, type ShellSnapshot } from './engine/shell';

/** Mission progress that is not part of the shell itself. */
export interface MissionMeta {
  hintsUsed: number;
  attempts: number;
  startedAt: string;
}

function isSnapshot(value: unknown): value is ShellSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const snapshot = value as Partial<ShellSnapshot>;
  return (
    typeof snapshot.cwd === 'string' &&
    Array.isArray(snapshot.history) &&
    typeof snapshot.vfs === 'object' &&
    snapshot.vfs?.type === 'dir'
  );
}

/**
 * Builds the shell for a mission with the player's personal secrets.
 * Restores the saved checkpoint when there is a valid one.
 */
export function createMissionShell(
  mission: Mission,
  start: MissionStart,
  lang: Lang,
): { shell: Shell; meta: MissionMeta; restored: boolean } {
  const saved = start.checkpoint?.missionId === mission.id ? start.checkpoint : null;
  const restore = saved && isSnapshot(saved.state) ? saved.state : undefined;
  const shell = createShell({
    filesystem: mission.filesystem,
    startDir: mission.start_dir,
    user: mission.user,
    goal: mission.goal,
    missionId: mission.id,
    secrets: start.secrets,
    lang,
    restore,
  });
  const meta: MissionMeta =
    restore && saved
      ? { hintsUsed: saved.hintsUsed, attempts: saved.attempts, startedAt: saved.startedAt }
      : { hintsUsed: 0, attempts: 0, startedAt: new Date().toISOString() };
  return { shell, meta, restored: !!restore };
}

export function toCheckpoint(
  shell: Shell,
  mission: Mission,
  meta: MissionMeta,
  now = new Date(),
): Checkpoint {
  return {
    game: 'linux',
    missionId: mission.id,
    state: shell.snapshot(),
    hintsUsed: meta.hintsUsed,
    attempts: meta.attempts,
    startedAt: meta.startedAt,
    updatedAt: now.toISOString(),
  };
}
