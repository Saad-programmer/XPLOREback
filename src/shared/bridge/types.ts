import type { Lang } from '../i18n/text';

export type GameId = 'linux' | 'sql' | 'git' | 'network';

export interface Player {
  id: string;
  name: string;
  promotion?: string;
  avatarUrl?: string;
  points: number;
}

export interface MissionResult {
  status: 'done';
  bestScore: number;
  hintsUsed: number;
  attempts: number;
  bestTimeS: number;
  shortestCmdLen: number | null;
  firstCompletedAt: string;
}

export interface Unlock {
  itemType: 'sticker' | 'sound' | 'meme';
  itemId: string;
  unlockedAt: string;
}

export interface GameProgress {
  game: GameId;
  currentMissionId: string | null;
  missions: Record<string, MissionResult>;
  unlocks: Unlock[];
  totalPoints: number;
}

/** In-progress mission, saved after each command. `state` is game-specific JSON. */
export interface Checkpoint {
  game: GameId;
  missionId: string;
  state: unknown;
  hintsUsed: number;
  attempts: number;
  startedAt: string;
  updatedAt: string;
}

export interface MissionStart {
  missionId: string;
  /** Personal values for `{{name}}` placeholders, e.g. { password: 'k7Qx-PENGU-42' }. */
  secrets: Record<string, string>;
  checkpoint: Checkpoint | null;
}

export interface SubmitStats {
  hintsUsed: number;
  attempts: number;
  timeS: number;
  shortestCmdLen: number | null;
}

export interface SubmitResult {
  success: boolean;
  pointsAwarded: number;
  firstCompletion: boolean;
  stickers: string[];
  progress: GameProgress;
}

export interface Settings {
  muted: boolean;
  memeSounds: boolean;
  reducedMotion: boolean;
  crt: boolean;
  language: Lang;
  maximized: boolean;
}

/** Sound off by default (class mode), see PRD section 7. */
export const DEFAULT_SETTINGS: Settings = {
  muted: true,
  memeSounds: true,
  reducedMotion: false,
  crt: false,
  language: 'fr',
  maximized: false,
};

/** The only way game code talks to Xplore (PRD section 12). */
export interface LabsBridge {
  getCurrentPlayer(): Promise<Player>;
  getProgress(game: GameId): Promise<GameProgress>;
  startMission(game: GameId, missionId: string): Promise<MissionStart>;
  saveCheckpoint(checkpoint: Checkpoint): Promise<void>;
  /** `answer` is the submitted password, or null for goals checked in the browser. */
  submitMission(
    game: GameId,
    missionId: string,
    answer: string | null,
    stats: SubmitStats,
  ): Promise<SubmitResult>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}

export type BridgeErrorCode =
  'network' | 'unauthorized' | 'not_found' | 'invalid' | 'too_large' | 'rate_limited' | 'server';

export class BridgeError extends Error {
  constructor(
    readonly code: BridgeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BridgeError';
  }

  /** Worth trying again later (bad network, busy or broken server). */
  get retryable(): boolean {
    return this.code === 'network' || this.code === 'server' || this.code === 'rate_limited';
  }
}

/** Unknown errors (e.g. a bug in fetch) are treated as network problems. */
export function isRetryable(error: unknown): boolean {
  return error instanceof BridgeError ? error.retryable : true;
}

export function emptyProgress(game: GameId): GameProgress {
  return { game, currentMissionId: null, missions: {}, unlocks: [], totalPoints: 0 };
}
