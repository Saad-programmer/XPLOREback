import {
  BridgeError,
  type BridgeErrorCode,
  type Checkpoint,
  type GameId,
  type GameProgress,
  type LabsBridge,
  type MissionStart,
  type Player,
  type Settings,
  type SubmitResult,
  type SubmitStats,
} from './types';

function codeForStatus(status: number): BridgeErrorCode {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'not_found';
  if (status === 413) return 'too_large';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 422) return 'invalid';
  return 'server';
}

/**
 * Calls the NestJS labs module (PRD section 12) with the Xplore login cookie.
 * Phase B: not tested against the real backend yet; adjust paths and auth then.
 */
export class ApiBridge implements LabsBridge {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: typeof fetch = (...args) => fetch(...args),
  ) {}

  getCurrentPlayer(): Promise<Player> {
    return this.request('GET', '/labs/me');
  }

  getProgress(game: GameId): Promise<GameProgress> {
    return this.request('GET', `/labs/progress/${game}`);
  }

  startMission(game: GameId, missionId: string): Promise<MissionStart> {
    return this.request('POST', `/labs/missions/${encodeURIComponent(missionId)}/start`, { game });
  }

  saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    // keepalive lets the request finish when the player closes the page.
    return this.request(
      'PUT',
      `/labs/missions/${encodeURIComponent(checkpoint.missionId)}/checkpoint`,
      checkpoint,
      true,
    );
  }

  submitMission(
    game: GameId,
    missionId: string,
    answer: string | null,
    stats: SubmitStats,
  ): Promise<SubmitResult> {
    return this.request('POST', `/labs/missions/${encodeURIComponent(missionId)}/submit`, {
      game,
      answer,
      stats,
    });
  }

  getSettings(): Promise<Settings> {
    return this.request('GET', '/labs/settings');
  }

  saveSettings(settings: Settings): Promise<void> {
    return this.request('PUT', '/labs/settings', settings);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    keepalive = false,
  ): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method,
        credentials: 'include',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        keepalive,
      });
    } catch {
      throw new BridgeError('network', `${method} ${path}: network error`);
    }
    if (!response.ok) {
      throw new BridgeError(
        codeForStatus(response.status),
        `${method} ${path}: HTTP ${response.status}`,
      );
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}
