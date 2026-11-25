import { describe, expect, it, vi } from 'vitest';
import { ApiBridge } from '@/src/shared/bridge/api-bridge';
import { MAX_CHECKPOINT_BYTES, MOCK_SECRET, MockBridge } from '@/src/shared/bridge/mock-bridge';
import { personalPassword } from '@/src/shared/bridge/password';
import { missionPassword } from '@/src/labs/mission-password';
import {
  BridgeError,
  DEFAULT_SETTINGS,
  SOLUTION_LIMITS,
  solutionOf,
} from '@/src/shared/bridge/types';
import { memoryStore } from '@/src/shared/storage';
import { checkpoint, NO_HINTS } from './fakes';

describe('personal passwords', () => {
  it('are stable, readable and personal', async () => {
    const a = await personalPassword(MOCK_SECRET, 'ali', 'archive-hidden-scroll');
    expect(a).toMatch(/^[a-zA-Z2-9]{4}-[A-Z]+-\d{2}$/);
    expect(await personalPassword(MOCK_SECRET, 'ali', 'archive-hidden-scroll')).toBe(a);
    expect(await personalPassword(MOCK_SECRET, 'sara', 'archive-hidden-scroll')).not.toBe(a);
    expect(await personalPassword(MOCK_SECRET, 'ali', 'wake-up-hello')).not.toBe(a);
  });

  it('uses the same HMAC format in the server mission validator', async () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    const missionId = 'wake-up-hello-world';
    expect(await personalPassword(MOCK_SECRET, userId, missionId)).toBe(
      missionPassword(MOCK_SECRET, userId, missionId),
    );
  });
});

describe('MockBridge', () => {
  it('starts with a default player, empty progress and default settings', async () => {
    const bridge = new MockBridge(memoryStore());
    expect(await bridge.getCurrentPlayer()).toMatchObject({ id: 'mock-player', points: 0 });
    expect(await bridge.getProgress('linux')).toEqual({
      game: 'linux',
      currentMissionId: null,
      missions: {},
      unlocks: [],
      totalPoints: 0,
    });
    expect(await bridge.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('gives the personal password and the saved checkpoint on start', async () => {
    const bridge = new MockBridge(memoryStore());
    await bridge.saveCheckpoint(checkpoint());
    const start = await bridge.startMission('linux', 'wake-up-hello');
    expect(start.secrets.password).toBe(
      await personalPassword(MOCK_SECRET, 'mock-player', 'wake-up-hello'),
    );
    expect(start.checkpoint).toEqual(checkpoint());
    expect((await bridge.getProgress('linux')).currentMissionId).toBe('wake-up-hello');
  });

  it('refuses checkpoints over 200 KB', async () => {
    const bridge = new MockBridge(memoryStore());
    const huge = checkpoint({ state: 'x'.repeat(MAX_CHECKPOINT_BYTES) });
    await expect(bridge.saveCheckpoint(huge)).rejects.toMatchObject({ code: 'too_large' });
  });

  it('checks the password again on submit', async () => {
    const bridge = new MockBridge(memoryStore());
    const result = await bridge.submitMission('linux', 'm1', 'wrong', NO_HINTS);
    expect(result).toMatchObject({ success: false, pointsAwarded: 0 });
    const { secrets } = await bridge.startMission('linux', 'm1');
    expect(await bridge.submitMission('linux', 'm1', secrets.password, NO_HINTS)).toMatchObject({
      success: true,
    });
  });

  it('gives points once, keeps the best stats and removes the checkpoint', async () => {
    const bridge = new MockBridge(memoryStore(), { now: () => new Date('2026-10-18T10:00:00Z') });
    await bridge.saveCheckpoint(checkpoint({ missionId: 'm1' }));
    const first = await bridge.submitMission('linux', 'm1', null, NO_HINTS);
    expect(first).toMatchObject({ success: true, pointsAwarded: 15, firstCompletion: true });

    const again = await bridge.submitMission('linux', 'm1', null, {
      hintsUsed: 2,
      attempts: 1,
      timeS: 60,
      shortestCmdLen: null,
    });
    expect(again).toMatchObject({ pointsAwarded: 0, firstCompletion: false });
    expect(again.progress.missions.m1).toEqual({
      status: 'done',
      bestScore: 15,
      hintsUsed: 0,
      attempts: 4,
      bestTimeS: 60,
      shortestCmdLen: 8,
      firstCompletedAt: '2026-10-18T10:00:00.000Z',
    });
    expect(again.progress.totalPoints).toBe(15);
    expect((await bridge.getCurrentPlayer()).points).toBe(15);
    expect((await bridge.startMission('linux', 'm1')).checkpoint).toBeNull();
  });

  it('gives 10 points when hints were used', async () => {
    const bridge = new MockBridge(memoryStore());
    const result = await bridge.submitMission('linux', 'm1', null, { ...NO_HINTS, hintsUsed: 1 });
    expect(result.pointsAwarded).toBe(10);
  });

  it('keeps the shortest winning run for the recap', async () => {
    const bridge = new MockBridge(memoryStore());
    const run = (commands: string[]) =>
      bridge.submitMission('linux', 'm1', null, { ...NO_HINTS, commands });
    await run(['ls', '  ls -a  ', '', 'cat .secret_scroll']);
    expect((await bridge.getProgress('linux')).missions.m1.solution).toEqual([
      'ls',
      'ls -a',
      'cat .secret_scroll',
    ]);
    await run(['ls', 'pwd', 'ls -a', 'cd ..', 'cat .secret_scroll']);
    expect((await bridge.getProgress('linux')).missions.m1.solution).toHaveLength(3);
    await run(['cat .secret_scroll']);
    expect((await bridge.getProgress('linux')).missions.m1.solution).toEqual([
      'cat .secret_scroll',
    ]);
  });

  it('caps a saved solution like the server does', () => {
    const long = Array.from({ length: 60 }, (_, i) => `echo ${i}`);
    expect(solutionOf(long)).toHaveLength(SOLUTION_LIMITS.commands);
    expect(solutionOf(long).at(-1)).toBe('echo 59');
    expect(solutionOf(['x'.repeat(500)])[0]).toHaveLength(SOLUTION_LIMITS.length);
  });

  it('keeps everything in the store, like a server would', async () => {
    const store = memoryStore();
    await new MockBridge(store).submitMission('linux', 'm1', null, NO_HINTS);
    await new MockBridge(store).saveSettings({ ...DEFAULT_SETTINGS, muted: false });
    const later = new MockBridge(store);
    expect((await later.getProgress('linux')).missions.m1).toBeDefined();
    expect((await later.getSettings()).muted).toBe(false);
  });
});

describe('SupabaseBridge contract', () => {
  it('returns the same player contract as MockBridge', async () => {
    const token = `header.${Buffer.from(
      JSON.stringify({
        xplore_user_id: '00000000-0000-4000-8000-000000000001',
        tenant_id: '00000000-0000-4000-8000-000000000101',
      }),
    ).toString('base64url')}.signature`;
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.test');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-anon-key');
    vi.stubGlobal('window', { xploreLabsAuth: { getAccessToken: async () => token } });
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({ id: 'supabase-auth-user', email: 'player@example.test' }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        );
      }
      if (url.endsWith('/labs/api/labs/me')) {
        return new Response(
          JSON.stringify({
            id: '00000000-0000-4000-8000-000000000001',
            name: 'Alice',
            points: 15,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response('Unexpected test request', { status: 500 });
    });

    try {
      vi.resetModules();
      const { SupabaseBridge } = await import('@/src/shared/bridge/supabase-bridge');
      const supabasePlayer = await new SupabaseBridge().getCurrentPlayer();
      const mockPlayer = await new MockBridge(memoryStore()).getCurrentPlayer();
      expect(supabasePlayer).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        points: expect.any(Number),
      });
      expect(mockPlayer).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        points: expect.any(Number),
      });
      expect(Object.keys(supabasePlayer).sort()).toEqual(['id', 'name', 'points']);
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });
});

describe('ApiBridge', () => {
  const ok = (body: unknown, status = 200) =>
    new Response(status === 204 ? null : JSON.stringify(body), { status });

  it('calls the labs endpoints with the login cookie', async () => {
    const fetchFn = vi.fn(async () => ok({ success: true }));
    const bridge = new ApiBridge('https://xplore.test/api', fetchFn);
    await bridge.submitMission('linux', 'm 1', 'pw', NO_HINTS);
    expect(fetchFn).toHaveBeenCalledWith('https://xplore.test/api/labs/missions/m%201/submit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'linux', answer: 'pw', stats: NO_HINTS }),
      keepalive: false,
    });
  });

  it('uses keepalive for checkpoints and handles 204', async () => {
    const fetchFn = vi.fn(async () => ok(null, 204));
    await new ApiBridge('', fetchFn).saveCheckpoint(checkpoint());
    expect(fetchFn).toHaveBeenCalledWith(
      '/labs/missions/wake-up-hello/checkpoint',
      expect.objectContaining({ method: 'PUT', keepalive: true }),
    );
  });

  it('turns HTTP and network failures into bridge errors', async () => {
    const statuses: [number, string][] = [
      [401, 'unauthorized'],
      [413, 'too_large'],
      [429, 'rate_limited'],
      [422, 'invalid'],
      [500, 'server'],
    ];
    for (const [status, code] of statuses) {
      const bridge = new ApiBridge('', async () => ok({}, status));
      await expect(bridge.getProgress('linux')).rejects.toMatchObject({ code });
    }
    const offline = new ApiBridge('', async () => {
      throw new TypeError('Failed to fetch');
    });
    const error = await offline.getCurrentPlayer().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BridgeError);
    expect((error as BridgeError).retryable).toBe(true);
  });
});
