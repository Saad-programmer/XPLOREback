import { readJson, writeJson, type KeyValueStore } from '../storage';
import { personalPassword } from './password';
import {
  BridgeError,
  DEFAULT_SETTINGS,
  emptyProgress,
  solutionOf,
  type Checkpoint,
  type GameId,
  type GameProgress,
  type LabsBridge,
  type MissionResult,
  type MissionStart,
  type Player,
  type Settings,
  type SubmitResult,
  type SubmitStats,
} from './types';

/** Not a secret: mock mode only. The real one lives in NestJS env (LABS_HMAC_SECRET). */
export const MOCK_SECRET = 'xplore-labs-mock-secret';
/** Same limit as the server (PRD section 14). */
export const MAX_CHECKPOINT_BYTES = 200_000;
/** Proposed values (PRD section 9), to confirm with the Xplore admins. */
export const REWARDS = { mission: 10, noHintBonus: 5 };

const DEFAULT_PLAYER: Player = { id: 'mock-player', name: 'Intern', promotion: 'ILISI', points: 0 };

const KEYS = {
  player: 'labs:mock:player',
  settings: 'labs:mock:settings',
  progress: (game: GameId) => `labs:mock:progress:${game}`,
  checkpoint: (game: GameId, missionId: string) => `labs:mock:checkpoint:${game}:${missionId}`,
};

interface MockOptions {
  /** Fake network delay, to see the saving indicator during development. */
  latencyMs?: number;
  now?: () => Date;
}

/**
 * Plays the role of the NestJS labs module in localStorage, with the same data
 * shapes and the same rules (personal passwords, points only once, size limit).
 */
export class MockBridge implements LabsBridge {
  constructor(
    private readonly store: KeyValueStore,
    private readonly options: MockOptions = {},
  ) {}

  async getCurrentPlayer(): Promise<Player> {
    await this.delay();
    return this.player();
  }

  async getProgress(game: GameId): Promise<GameProgress> {
    await this.delay();
    return this.progress(game);
  }

  async startMission(game: GameId, missionId: string): Promise<MissionStart> {
    await this.delay();
    const progress = this.progress(game);
    progress.currentMissionId = missionId;
    this.write(KEYS.progress(game), progress);
    return {
      missionId,
      secrets: { password: await personalPassword(MOCK_SECRET, this.player().id, missionId) },
      checkpoint: readJson<Checkpoint>(this.store, KEYS.checkpoint(game, missionId)),
    };
  }

  async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    await this.delay();
    const json = JSON.stringify(checkpoint);
    if (json.length > MAX_CHECKPOINT_BYTES) {
      throw new BridgeError('too_large', 'Checkpoint is larger than 200 KB');
    }
    if (!this.store.set(KEYS.checkpoint(checkpoint.game, checkpoint.missionId), json)) {
      throw new BridgeError('server', 'Could not save the checkpoint');
    }
  }

  async submitMission(
    game: GameId,
    missionId: string,
    answer: string | null,
    stats: SubmitStats,
  ): Promise<SubmitResult> {
    await this.delay();
    const player = this.player();
    const progress = this.progress(game);
    if (answer !== null) {
      const expected = await personalPassword(MOCK_SECRET, player.id, missionId);
      if (answer.trim() !== expected) {
        return { success: false, pointsAwarded: 0, firstCompletion: false, stickers: [], progress };
      }
    }

    const score = REWARDS.mission + (stats.hintsUsed === 0 ? REWARDS.noHintBonus : 0);
    const previous = progress.missions[missionId];
    const firstCompletion = !previous;
    const pointsAwarded = firstCompletion ? score : 0;
    progress.missions[missionId] = previous
      ? mergeResult(previous, score, stats)
      : {
          status: 'done',
          bestScore: score,
          hintsUsed: stats.hintsUsed,
          attempts: stats.attempts,
          bestTimeS: stats.timeS,
          shortestCmdLen: stats.shortestCmdLen,
          solution: stats.commands && solutionOf(stats.commands),
          firstCompletedAt: this.now(),
        };
    progress.totalPoints += pointsAwarded;
    this.write(KEYS.progress(game), progress);
    this.write(KEYS.player, { ...player, points: player.points + pointsAwarded });
    this.store.remove(KEYS.checkpoint(game, missionId));
    return { success: true, pointsAwarded, firstCompletion, stickers: [], progress };
  }

  async getSettings(): Promise<Settings> {
    await this.delay();
    return { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>(this.store, KEYS.settings) };
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.delay();
    this.write(KEYS.settings, settings);
  }

  private player(): Player {
    return readJson<Player>(this.store, KEYS.player) ?? { ...DEFAULT_PLAYER };
  }

  private progress(game: GameId): GameProgress {
    return readJson<GameProgress>(this.store, KEYS.progress(game)) ?? emptyProgress(game);
  }

  private write(key: string, value: unknown): void {
    if (!writeJson(this.store, key, value))
      throw new BridgeError('server', `Could not save ${key}`);
  }

  private now(): string {
    return (this.options.now?.() ?? new Date()).toISOString();
  }

  private async delay(): Promise<void> {
    const ms = this.options.latencyMs ?? 0;
    if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/** Keeps the best of each stat. Points are never given twice. */
function mergeResult(previous: MissionResult, score: number, stats: SubmitStats): MissionResult {
  const shortest = [previous.shortestCmdLen, stats.shortestCmdLen].filter(
    (n): n is number => n !== null,
  );
  return {
    ...previous,
    bestScore: Math.max(previous.bestScore, score),
    hintsUsed: Math.min(previous.hintsUsed, stats.hintsUsed),
    attempts: previous.attempts + stats.attempts,
    bestTimeS: Math.min(previous.bestTimeS, stats.timeS),
    shortestCmdLen: shortest.length ? Math.min(...shortest) : null,
    solution: shorterSolution(previous.solution, stats.commands),
  };
}

/** The recap shows the player's shortest winning run. */
function shorterSolution(previous: string[] | undefined, commands: string[] | undefined) {
  if (!commands) return previous;
  const next = solutionOf(commands);
  return previous && previous.length <= next.length ? previous : next;
}
