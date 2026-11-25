import { asset } from '../asset';
import { getLabsAuthHeaders } from './auth';

interface XpAwardResult {
  awardedXp: number;
  status: string;
}

interface EventResult {
  awards: XpAwardResult[];
  verificationStatus: 'UNVERIFIED' | 'VERIFIED';
}

export interface CompleteLevelInput {
  levelId: string;
  score: number;
  durationSeconds: number;
  hintsUsed: number;
  mistakes: number;
}

export interface LabsGameClient {
  startSession(): Promise<void>;
  completeLevel(input: CompleteLevelInput): Promise<EventResult | null>;
  endSession(): Promise<void>;
}

// SupabaseBridge owns the authoritative mission reward path in Supabase mode.
// Keep the legacy event client active for mock/api mode only to prevent duplicate awards.
const enabled =
  process.env.NEXT_PUBLIC_LABS_GAMIFICATION_ENABLED === 'true' &&
  process.env.NEXT_PUBLIC_LABS_BRIDGE !== 'supabase';

export function createLabsGameClient(gameId: string): LabsGameClient {
  let sessionId: string | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const headers = async () => ({
    'content-type': 'application/json',
    ...(await getLabsAuthHeaders()),
  });

  async function post(path: string, body: unknown): Promise<Response> {
    const response = await fetch(asset(`api/v1/labs${path}`), {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(detail?.error ?? `Labs gamification request failed (${response.status}).`);
    }
    return response;
  }

  return {
    async startSession() {
      if (!enabled) return;
      if (sessionId) await this.endSession();
      const response = await post('/sessions/start', { gameId });
      const session = (await response.json()) as { id: string };
      sessionId = session.id;
      heartbeat = setInterval(() => {
        if (!sessionId) return;
        void post(`/sessions/${sessionId}/heartbeat`, {}).catch((error: unknown) => {
          console.error('[labs] could not send the gamification heartbeat', error);
        });
      }, 30_000);
    },

    async completeLevel(input) {
      if (!enabled) return null;
      if (!sessionId) await this.startSession();
      if (!sessionId) return null;
      const response = await post('/events', {
        eventId: crypto.randomUUID(),
        gameId,
        levelId: input.levelId,
        sessionId,
        eventType: 'LEVEL_COMPLETED',
        payload: {
          score: input.score,
          durationSeconds: input.durationSeconds,
          hintsUsed: input.hintsUsed,
          mistakes: input.mistakes,
        },
      });
      return response.json() as Promise<EventResult>;
    },

    async endSession() {
      if (!enabled || !sessionId) return;
      const currentSessionId = sessionId;
      sessionId = null;
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = null;
      await post(`/sessions/${currentSessionId}/end`, {});
    },
  };
}
