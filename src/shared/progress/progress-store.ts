import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  DEFAULT_SETTINGS,
  isRetryable,
  type Checkpoint,
  type GameId,
  type GameProgress,
  type LabsBridge,
  type MissionStart,
  type Player,
  type Settings,
  type SubmitResult,
  type SubmitStats,
} from '../bridge/types';
import { readJson, writeJson, type KeyValueStore } from '../storage';
import { SaveQueue, type SaveStatus } from './save-queue';

/** How often an in-progress mission is sent to the server (PRD section 12). */
export const CHECKPOINT_INTERVAL_MS = 120_000;

export type SubmitOutcome =
  | { kind: 'done'; result: SubmitResult }
  /** Offline: saved locally and sent later. The mission counts as done on this device. */
  | { kind: 'queued' };

export interface ProgressState {
  player: Player | null;
  progress: Partial<Record<GameId, GameProgress>>;
  settings: Settings;
  saveStatus: SaveStatus;
  pendingSaves: number;

  /** Loads the player and settings. Safe to call more than once. */
  init(): Promise<void>;
  loadProgress(game: GameId): Promise<GameProgress>;
  /** Personal secrets + the newest checkpoint (this device or the server). */
  startMission(game: GameId, missionId: string): Promise<MissionStart>;
  /** Call after each command: saved on this device at once, on the server every 2 min. */
  recordCheckpoint(checkpoint: Checkpoint): void;
  /** Sends unsent checkpoints now (page hidden or closed). */
  flushCheckpoints(): Promise<void>;
  submitMission(
    game: GameId,
    missionId: string,
    answer: string | null,
    stats: SubmitStats,
  ): Promise<SubmitOutcome>;
  updateSettings(patch: Partial<Settings>): void;
  dispose(): void;
}

export type ProgressStore = StoreApi<ProgressState>;

interface Dependencies {
  bridge: LabsBridge;
  store: KeyValueStore;
  checkpointIntervalMs?: number;
  retryDelaysMs?: number[];
}

const KEYS = {
  settings: 'labs:settings',
  queue: (playerId: string) => `labs:queue:${playerId}`,
  checkpoint: (playerId: string, game: GameId, missionId: string) =>
    `labs:checkpoint:${playerId}:${game}:${missionId}`,
};

const slot = (checkpoint: Checkpoint) => `${checkpoint.game}:${checkpoint.missionId}`;

function newest(a: Checkpoint | null, b: Checkpoint | null): Checkpoint | null {
  if (!a || !b) return a ?? b;
  return Date.parse(a.updatedAt) >= Date.parse(b.updatedAt) ? a : b;
}

export function createProgressStore({
  bridge,
  store,
  checkpointIntervalMs = CHECKPOINT_INTERVAL_MS,
  retryDelaysMs,
}: Dependencies): ProgressStore {
  let queue: SaveQueue | null = null;
  let initializing: Promise<void> | null = null;
  let settingsTouched = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  /** Checkpoints saved on this device but not yet sent to the server. */
  const unsent = new Map<string, Checkpoint>();

  return createStore<ProgressState>()((set, get) => {
    const playerId = () => {
      const { player } = get();
      if (!player) throw new Error('Call init() before using progress');
      return player.id;
    };

    const applyResult = (game: GameId, result: SubmitResult) => {
      if (!result.success) return;
      set((state) => ({
        progress: { ...state.progress, [game]: result.progress },
        player: state.player && {
          ...state.player,
          points: state.player.points + result.pointsAwarded,
        },
      }));
    };

    const ensureTimer = () => {
      timer ??= setInterval(() => void get().flushCheckpoints(), checkpointIntervalMs);
    };

    return {
      player: null,
      progress: {},
      // Defaults first, like the server render: reading saved settings here would make
      // the first browser render differ from the HTML (hydration error). init() loads them.
      settings: { ...DEFAULT_SETTINGS },
      saveStatus: 'idle',
      pendingSaves: 0,

      init() {
        if (!initializing) {
          // Settings saved on this device apply at once, before the bridge answers.
          set({
            settings: { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>(store, KEYS.settings) },
          });
        }
        initializing ??= (async () => {
          // Settings load in parallel and never block the screen.
          void bridge
            .getSettings()
            .then((settings) => {
              // The player changed a setting meanwhile: theirs wins.
              if (settingsTouched) return;
              set({ settings });
              writeJson(store, KEYS.settings, settings);
            })
            .catch(() => {
              // Keep the settings saved on this device.
            });
          const player = await bridge.getCurrentPlayer();
          queue = new SaveQueue(bridge, store, {
            storageKey: KEYS.queue(player.id),
            retryDelaysMs,
            onStatus: (saveStatus, pendingSaves) => set({ saveStatus, pendingSaves }),
            onSubmitted: (item, result) => {
              applyResult(item.game, result);
              if (result.success)
                store.remove(KEYS.checkpoint(player.id, item.game, item.missionId));
            },
          });
          set({ player, pendingSaves: queue.pending });
          // Saves left from a previous visit (e.g. the network was down).
          if (queue.pending) void queue.flush();
        })();
        initializing.catch(() => {
          initializing = null;
        });
        return initializing;
      },

      async loadProgress(game) {
        // In parallel: the request does not need the player first.
        const [, progress] = await Promise.all([get().init(), bridge.getProgress(game)]);
        set((state) => ({ progress: { ...state.progress, [game]: progress } }));
        return progress;
      },

      async startMission(game, missionId) {
        const [, start] = await Promise.all([get().init(), bridge.startMission(game, missionId)]);
        const local = readJson<Checkpoint>(store, KEYS.checkpoint(playerId(), game, missionId));
        return { ...start, checkpoint: newest(local, start.checkpoint) };
      },

      recordCheckpoint(checkpoint) {
        writeJson(
          store,
          KEYS.checkpoint(playerId(), checkpoint.game, checkpoint.missionId),
          checkpoint,
        );
        unsent.set(slot(checkpoint), checkpoint);
        ensureTimer();
      },

      async flushCheckpoints() {
        if (!queue || unsent.size === 0) return;
        const checkpoints = [...unsent.values()];
        unsent.clear();
        for (const checkpoint of checkpoints)
          void queue.enqueue({ kind: 'checkpoint', checkpoint });
        await queue.flush();
      },

      async submitMission(game, missionId, answer, stats) {
        await get().init();
        try {
          const result = await bridge.submitMission(game, missionId, answer, stats);
          applyResult(game, result);
          if (result.success) {
            unsent.delete(`${game}:${missionId}`);
            store.remove(KEYS.checkpoint(playerId(), game, missionId));
          }
          return { kind: 'done', result };
        } catch (error) {
          if (!isRetryable(error) || !queue) throw error;
          // Keep the checkpoint on this device until the server confirms (onSubmitted).
          unsent.delete(`${game}:${missionId}`);
          void queue.enqueue({ kind: 'submit', game, missionId, answer, stats });
          return { kind: 'queued' };
        }
      },

      updateSettings(patch) {
        settingsTouched = true;
        const settings = { ...get().settings, ...patch };
        set({ settings });
        writeJson(store, KEYS.settings, settings);
        void queue?.enqueue({ kind: 'settings', settings });
      },

      dispose() {
        if (timer) clearInterval(timer);
        timer = null;
        queue?.dispose();
      },
    };
  });
}
