export const WEEKLY_XP_CAP = 50;
export const XP_TIMEZONE = 'Africa/Casablanca';

export type AllowedEventType =
  | 'GAME_STARTED'
  | 'GAME_FINISHED'
  | 'LEVEL_STARTED'
  | 'LEVEL_COMPLETED'
  | 'SCORE_SUBMITTED'
  | 'PERSONAL_RECORD_IMPROVED'
  | 'GLOBAL_RECORD_BEATEN'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'SESSION_HEARTBEAT'
  | 'SESSION_ENDED';

export interface PlayerIdentity {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  externalXploreUserId?: string | null;
}

export interface GameDefinitionRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  enabled: boolean;
  scoreDirection: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
}

export interface LevelCompletionInput {
  playerId: string;
  gameId: string;
  levelId: string;
  sessionId?: string;
  score?: number;
  durationSeconds?: number;
  hintsUsed?: number;
  mistakes?: number;
  noHint?: boolean;
  noMistakes?: boolean;
  referenceTimeSeconds?: number;
  eventId?: string;
}

export interface WeeklyXpSummary {
  playerId: string;
  weeklyXp: number;
  weeklyCap: number;
  remainingXp: number;
  capReached: boolean;
  lifetimeLabsXp: number;
  currentWeekStart: string;
  nextResetAt: string;
  completedLevels: number;
  unlockedAchievements: number;
}
