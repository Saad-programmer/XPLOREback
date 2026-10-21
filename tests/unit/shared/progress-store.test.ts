import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgressStore } from '@/src/shared/progress/progress-store';
import { memoryStore, type KeyValueStore } from '@/src/shared/storage';
import { checkpoint, flakyBridge, NO_HINTS } from './fakes';

/** One "page load": a new store over the same localStorage. */
function openPage(store: KeyValueStore = memoryStore()) {
  const { bridge, control } = flakyBridge(store);
  const progress = createProgressStore({
    bridge,
    store,
    checkpointIntervalMs: 120_000,
    retryDelaysMs: [1_000],
  });
  return { store, control, progress, state: () => progress.getState() };
}

describe('progress store', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('loads the player and settings once', async () => {
    const page = openPage();
    await Promise.all([page.state().init(), page.state().init()]);
    expect(page.state().player?.id).toBe('mock-player');
    expect(page.control.calls.filter((call) => call === 'getCurrentPlayer')).toHaveLength(1);
  });

  it('autosaves on this device at once and on the server every 2 minutes', async () => {
    const page = openPage();
    await page.state().init();
    page.state().recordCheckpoint(checkpoint());
    expect(page.control.calls).not.toContain('saveCheckpoint');

    await vi.advanceTimersByTimeAsync(120_000);
    expect(page.control.calls.filter((c) => c === 'saveCheckpoint')).toHaveLength(1);
    expect(page.state().saveStatus).toBe('saved');

    // Nothing new: no extra request.
    await vi.advanceTimersByTimeAsync(120_000);
    expect(page.control.calls.filter((c) => c === 'saveCheckpoint')).toHaveLength(1);
    page.state().dispose();
  });

  it('sends right away when the page is hidden', async () => {
    const page = openPage();
    await page.state().init();
    page.state().recordCheckpoint(checkpoint());
    await page.state().flushCheckpoints();
    expect(page.control.calls).toContain('saveCheckpoint');
  });

  it('keeps work after a refresh, even if the server never got it', async () => {
    const first = openPage();
    await first.state().init();
    first.state().recordCheckpoint(checkpoint({ attempts: 7 }));
    first.state().dispose();

    const second = openPage(first.store);
    const start = await second.state().startMission('linux', 'wake-up-hello');
    expect(start.checkpoint?.attempts).toBe(7);
    expect(start.secrets.password).toMatch(/-/);
  });

  it('prefers the newest checkpoint between this device and the server', async () => {
    const page = openPage();
    await page.state().init();
    page.state().recordCheckpoint(checkpoint({ attempts: 2, updatedAt: '2026-10-18T09:00:00Z' }));
    await page.state().flushCheckpoints();
    // Another device saved later on the server.
    page.store.set(
      'labs:mock:checkpoint:linux:wake-up-hello',
      JSON.stringify(checkpoint({ attempts: 5, updatedAt: '2026-10-18T11:00:00Z' })),
    );
    const start = await page.state().startMission('linux', 'wake-up-hello');
    expect(start.checkpoint?.attempts).toBe(5);
  });

  it('applies a submit result and clears the checkpoint', async () => {
    const page = openPage();
    await page.state().init();
    page.state().recordCheckpoint(checkpoint());
    const outcome = await page.state().submitMission('linux', 'wake-up-hello', null, NO_HINTS);
    expect(outcome).toMatchObject({ kind: 'done', result: { pointsAwarded: 15 } });
    expect(page.state().player?.points).toBe(15);
    expect(page.state().progress.linux?.missions['wake-up-hello']).toBeDefined();
    expect((await page.state().startMission('linux', 'wake-up-hello')).checkpoint).toBeNull();
  });

  it('queues a submit while offline and applies it when back online', async () => {
    const page = openPage();
    await page.state().init();
    page.control.offline = true;
    const outcome = await page.state().submitMission('linux', 'm1', null, NO_HINTS);
    expect(outcome).toEqual({ kind: 'queued' });
    await vi.advanceTimersByTimeAsync(0);
    expect(page.state().saveStatus).toBe('retrying');
    expect(page.state().pendingSaves).toBe(1);

    page.control.offline = false;
    await vi.advanceTimersByTimeAsync(1_000);
    expect(page.state().saveStatus).toBe('saved');
    expect(page.state().player?.points).toBe(15);
  });

  it('sends a queued submit on the next visit', async () => {
    const first = openPage();
    await first.state().init();
    first.control.offline = true;
    await first.state().submitMission('linux', 'm1', null, NO_HINTS);
    first.state().dispose();

    const second = openPage(first.store);
    await second.state().init();
    await vi.runOnlyPendingTimersAsync();
    expect((await second.state().loadProgress('linux')).missions.m1).toBeDefined();
  });

  it('saves settings on this device and on the server', async () => {
    const page = openPage();
    await page.state().init();
    page.state().updateSettings({ muted: false, language: 'en' });
    await vi.runOnlyPendingTimersAsync();
    expect(page.control.calls).toContain('saveSettings');

    // A new page starts with the defaults (same as the server HTML), then init() applies them.
    const next = openPage(page.store);
    expect(next.state().settings).toMatchObject({ muted: true, language: 'fr' });
    void next.state().init();
    expect(next.state().settings).toMatchObject({ muted: false, language: 'en' });
  });
});

describe('settings loading', () => {
  it('never lets a late server answer overwrite a setting the player just changed', async () => {
    const store = memoryStore();
    const { bridge } = flakyBridge(store);
    let answer: (value: Awaited<ReturnType<typeof bridge.getSettings>>) => void = () => {};
    bridge.getSettings = () => new Promise((resolve) => (answer = resolve));
    const progress = createProgressStore({ bridge, store });

    await progress.getState().init(); // does not wait for the settings
    progress.getState().updateSettings({ language: 'en' });
    answer({ ...progress.getState().settings, language: 'fr' });
    await Promise.resolve();
    expect(progress.getState().settings.language).toBe('en');
  });
});
