import { describe, expect, it, vi } from 'vitest';
import { ApiBridge } from '@/src/shared/bridge/api-bridge';
import { MAX_CHECKPOINT_BYTES, MOCK_SECRET, MockBridge } from '@/src/shared/bridge/mock-bridge';
import { personalPassword } from '@/src/shared/bridge/password';
import { BridgeError, DEFAULT_SETTINGS } from '@/src/shared/bridge/types';
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

  it('keeps everything in the store, like a server would', async () => {
    const store = memoryStore();
    await new MockBridge(store).submitMission('linux', 'm1', null, NO_HINTS);
    await new MockBridge(store).saveSettings({ ...DEFAULT_SETTINGS, muted: false });
    const later = new MockBridge(store);
    expect((await later.getProgress('linux')).missions.m1).toBeDefined();
    expect((await later.getSettings()).muted).toBe(false);
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
