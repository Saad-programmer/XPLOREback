import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BridgeError } from '@/src/shared/bridge/types';
import { SaveQueue, type SaveStatus } from '@/src/shared/progress/save-queue';
import { memoryStore } from '@/src/shared/storage';
import { checkpoint, flakyBridge } from './fakes';

const KEY = 'labs:queue:test';

function setup() {
  const store = memoryStore();
  const { bridge, control } = flakyBridge(store);
  const statuses: SaveStatus[] = [];
  const queue = new SaveQueue(bridge, store, {
    storageKey: KEY,
    retryDelaysMs: [1_000, 5_000],
    onStatus: (status) => statuses.push(status),
  });
  return { store, bridge, control, statuses, queue };
}

describe('SaveQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sends saves and reports saving then saved', async () => {
    const { queue, statuses, control } = setup();
    await queue.enqueue({ kind: 'checkpoint', checkpoint: checkpoint() });
    expect(control.calls).toEqual(['saveCheckpoint']);
    expect(statuses).toEqual(['saving', 'saved']);
    expect(queue.pending).toBe(0);
  });

  it('retries with a growing delay until the network is back', async () => {
    const { queue, statuses, control, store } = setup();
    control.offline = true;
    await queue.enqueue({ kind: 'checkpoint', checkpoint: checkpoint() });
    expect(statuses.at(-1)).toBe('retrying');
    expect(store.get(KEY)).not.toBeNull();

    await vi.advanceTimersByTimeAsync(1_000);
    expect(control.calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(4_000);
    expect(control.calls).toHaveLength(2);

    control.offline = false;
    await vi.advanceTimersByTimeAsync(1_000);
    expect(control.calls).toHaveLength(3);
    expect(statuses.at(-1)).toBe('saved');
    expect(store.get(KEY)).toBeNull();
  });

  it('keeps only the latest checkpoint per mission, in order with other saves', async () => {
    const { queue, control } = setup();
    control.offline = true;
    await queue.enqueue({ kind: 'checkpoint', checkpoint: checkpoint({ attempts: 1 }) });
    await queue.enqueue({
      kind: 'submit',
      game: 'linux',
      missionId: 'other',
      answer: null,
      stats: { hintsUsed: 0, attempts: 1, timeS: 1, shortestCmdLen: null },
    });
    await queue.enqueue({ kind: 'checkpoint', checkpoint: checkpoint({ attempts: 9 }) });
    await queue.enqueue({ kind: 'checkpoint', checkpoint: checkpoint({ missionId: 'b' }) });
    expect(queue.pending).toBe(3);
  });

  it('survives a page refresh', async () => {
    const first = setup();
    first.control.offline = true;
    await first.queue.enqueue({ kind: 'checkpoint', checkpoint: checkpoint() });
    first.queue.dispose();

    const { bridge } = flakyBridge(first.store);
    const reloaded = new SaveQueue(bridge, first.store, { storageKey: KEY });
    expect(reloaded.pending).toBe(1);
    await reloaded.flush();
    expect(reloaded.pending).toBe(0);
  });

  it('drops saves the server refuses', async () => {
    const { queue, bridge } = setup();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    bridge.saveCheckpoint = async () => {
      throw new BridgeError('too_large', 'nope');
    };
    await queue.enqueue({ kind: 'checkpoint', checkpoint: checkpoint() });
    expect(queue.pending).toBe(0);
  });
});
