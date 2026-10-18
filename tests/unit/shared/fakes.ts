import { MockBridge } from '@/src/shared/bridge/mock-bridge';
import { BridgeError, type Checkpoint, type LabsBridge } from '@/src/shared/bridge/types';
import type { KeyValueStore } from '@/src/shared/storage';

/** A mock bridge whose "network" can be switched off, counting the calls. */
export function flakyBridge(store: KeyValueStore) {
  const real = new MockBridge(store, { now: () => new Date('2026-10-18T10:00:00Z') });
  const control = { offline: false, calls: [] as string[] };
  const guard =
    <A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>) =>
    async (...args: A): Promise<R> => {
      control.calls.push(name);
      if (control.offline) throw new BridgeError('network', 'offline');
      return fn(...args);
    };
  const bridge: LabsBridge = {
    getCurrentPlayer: guard('getCurrentPlayer', () => real.getCurrentPlayer()),
    getProgress: guard('getProgress', (game) => real.getProgress(game)),
    startMission: guard('startMission', (game, id) => real.startMission(game, id)),
    saveCheckpoint: guard('saveCheckpoint', (checkpoint) => real.saveCheckpoint(checkpoint)),
    submitMission: guard('submitMission', (game, id, answer, stats) =>
      real.submitMission(game, id, answer, stats),
    ),
    getSettings: guard('getSettings', () => real.getSettings()),
    saveSettings: guard('saveSettings', (settings) => real.saveSettings(settings)),
  };
  return { bridge, control };
}

export function checkpoint(overrides: Partial<Checkpoint> = {}): Checkpoint {
  return {
    game: 'linux',
    missionId: 'wake-up-hello',
    state: { cwd: '/home/intern' },
    hintsUsed: 0,
    attempts: 1,
    startedAt: '2026-10-18T09:00:00.000Z',
    updatedAt: '2026-10-18T09:05:00.000Z',
    ...overrides,
  };
}

export const NO_HINTS = { hintsUsed: 0, attempts: 3, timeS: 120, shortestCmdLen: 8 };
