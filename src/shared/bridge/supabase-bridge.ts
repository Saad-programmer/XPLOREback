import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { BASE_PATH } from '../asset';
import { getSupabaseAuthHeaders } from '../labs/auth';
import {
  BridgeError,
  DEFAULT_SETTINGS,
  emptyProgress,
  type BridgeErrorCode,
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

interface ProgressRow {
  current_mission_id: string | null;
  total_points: number;
}

interface MissionResultRow {
  mission_id: string;
  status: 'done';
  best_score: number;
  hints_used: number;
  attempts: number;
  best_time_s: number;
  shortest_cmd_len: number | null;
  solution: unknown;
  first_completed_at: string;
}

interface UnlockRow {
  item_type: 'sticker' | 'sound' | 'meme';
  item_id: string;
  unlocked_at: string;
}

interface SettingsRow {
  muted: boolean;
  meme_sounds: boolean;
  reduced_motion: boolean;
  crt: boolean;
  language: 'en' | 'fr';
  maximized: boolean;
  classic_cursor: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const CHECKPOINT_LIMIT = 200_000;

function codeForStatus(status: number): BridgeErrorCode {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'not_found';
  if (status === 413) return 'too_large';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 422) return 'invalid';
  return 'server';
}

function bridgeError(
  error: { message: string; status?: number; statusCode?: number },
  context: string,
): BridgeError {
  const status = Number(error.status ?? error.statusCode);
  return new BridgeError(
    Number.isInteger(status) ? codeForStatus(status) : 'server',
    `${context}: ${error.message}`,
  );
}

function mapMission(row: MissionResultRow): MissionResult {
  return {
    status: row.status,
    bestScore: row.best_score,
    hintsUsed: row.hints_used,
    attempts: row.attempts,
    bestTimeS: row.best_time_s,
    shortestCmdLen: row.shortest_cmd_len,
    solution: Array.isArray(row.solution)
      ? row.solution.filter((line): line is string => typeof line === 'string')
      : undefined,
    firstCompletedAt: row.first_completed_at,
  };
}

/** Persistent Labs data through RLS; reward writes only go through server routes. */
export class SupabaseBridge implements LabsBridge {
  private async context(): Promise<{
    headers: Record<string, string>;
    client: SupabaseClient;
    userId: string;
  }> {
    const headers = await getSupabaseAuthHeaders();
    const token = headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new BridgeError('unauthorized', 'Sign in with Xplore to use Supabase Labs.');
    if (!BASE_URL || !ANON_KEY) {
      throw new BridgeError(
        'server',
        'Supabase is not configured. Set the public Supabase URL and anon key.',
      );
    }

    const client = createClient(BASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { authorization: `Bearer ${token}` } },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user)
      throw error
        ? bridgeError(error, 'Could not verify the Xplore session')
        : new BridgeError('unauthorized', 'Your Xplore session is invalid or has expired.');
    const claims = decodeClaims(token);
    const userId = claims.xplore_user_id;
    if (typeof userId !== 'string' || !UUID.test(userId)) {
      throw new BridgeError('unauthorized', 'The Xplore identity claim is missing or invalid.');
    }
    return { headers, client, userId };
  }

  async getCurrentPlayer(): Promise<Player> {
    const { headers } = await this.context();
    return this.request<Player>('GET', '/me', undefined, headers);
  }

  async getProgress(game: GameId): Promise<GameProgress> {
    const { client, userId } = await this.context();
    const [progressResult, missionResult, unlockResult] = await Promise.all([
      client
        .from('labs_progress')
        .select('current_mission_id,total_points')
        .eq('user_id', userId)
        .eq('game', game)
        .maybeSingle(),
      client.from('labs_mission_result').select('*').eq('user_id', userId).eq('game', game),
      client.from('labs_unlock').select('item_type,item_id,unlocked_at').eq('user_id', userId),
    ]);
    const error = progressResult.error ?? missionResult.error ?? unlockResult.error;
    if (error) throw bridgeError(error, 'Could not load Labs progress');

    const progress = (progressResult.data as ProgressRow | null) ?? null;
    const missions: Record<string, MissionResult> = {};
    for (const row of (missionResult.data ?? []) as MissionResultRow[])
      missions[row.mission_id] = mapMission(row);
    return {
      ...emptyProgress(game),
      currentMissionId: progress?.current_mission_id ?? null,
      totalPoints: progress?.total_points ?? 0,
      missions,
      unlocks: ((unlockResult.data ?? []) as UnlockRow[]).map((row) => ({
        itemType: row.item_type,
        itemId: row.item_id,
        unlockedAt: row.unlocked_at,
      })),
    };
  }

  async startMission(game: GameId, missionId: string): Promise<MissionStart> {
    const { headers } = await this.context();
    return this.request<MissionStart>(
      'POST',
      `/missions/${encodeURIComponent(missionId)}/start`,
      { game },
      headers,
    );
  }

  async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const { client, userId } = await this.context();
    if (JSON.stringify(checkpoint).length > CHECKPOINT_LIMIT) {
      throw new BridgeError('too_large', 'Checkpoint is larger than 200 KB');
    }
    const { error } = await client.from('labs_checkpoint').upsert(
      {
        user_id: userId,
        game: checkpoint.game,
        mission_id: checkpoint.missionId,
        state: checkpoint.state,
        hints_used: checkpoint.hintsUsed,
        attempts: checkpoint.attempts,
        started_at: checkpoint.startedAt,
        updated_at: checkpoint.updatedAt,
      },
      { onConflict: 'user_id,mission_id' },
    );
    if (error) throw bridgeError(error, 'Could not save the mission checkpoint');
  }

  async submitMission(
    game: GameId,
    missionId: string,
    answer: string | null,
    stats: SubmitStats,
  ): Promise<SubmitResult> {
    const { headers } = await this.context();
    return this.request<SubmitResult>(
      'POST',
      `/missions/${encodeURIComponent(missionId)}/submit`,
      { game, answer, stats },
      headers,
    );
  }

  async getSettings(): Promise<Settings> {
    const { client, userId } = await this.context();
    const { data, error } = await client
      .from('labs_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw bridgeError(error, 'Could not load Labs settings');
    if (!data) return { ...DEFAULT_SETTINGS };
    const row = data as SettingsRow;
    return {
      muted: row.muted,
      memeSounds: row.meme_sounds,
      reducedMotion: row.reduced_motion,
      crt: row.crt,
      language: row.language,
      maximized: row.maximized,
      classicCursor: row.classic_cursor,
    };
  }

  async saveSettings(settings: Settings): Promise<void> {
    const { client, userId } = await this.context();
    const { error } = await client.from('labs_settings').upsert(
      {
        user_id: userId,
        muted: settings.muted,
        meme_sounds: settings.memeSounds,
        reduced_motion: settings.reducedMotion,
        crt: settings.crt,
        language: settings.language,
        maximized: settings.maximized,
        classic_cursor: settings.classicCursor,
      },
      { onConflict: 'user_id' },
    );
    if (error) throw bridgeError(error, 'Could not save Labs settings');
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    headers: Record<string, string>,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${BASE_PATH}/api/labs${path}`, {
        method,
        credentials: 'same-origin',
        headers: {
          ...headers,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store',
      });
    } catch {
      throw new BridgeError('network', `${method} ${path}: network error`);
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new BridgeError(
        codeForStatus(response.status),
        payload?.error ?? `${method} ${path}: HTTP ${response.status}`,
      );
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}

function decodeClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    if (!payload) return {};
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as Record<
      string,
      unknown
    >;
  } catch {
    return {};
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
