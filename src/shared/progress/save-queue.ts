import {
  isRetryable,
  type Checkpoint,
  type GameId,
  type LabsBridge,
  type Settings,
  type SubmitResult,
  type SubmitStats,
} from '../bridge/types';
import { readJson, writeJson, type KeyValueStore } from '../storage';

export type PendingSave =
  | { kind: 'checkpoint'; checkpoint: Checkpoint }
  | {
      kind: 'submit';
      game: GameId;
      missionId: string;
      answer: string | null;
      stats: SubmitStats;
    }
  | { kind: 'settings'; settings: Settings };

/** What the saving indicator shows. */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'retrying';

export const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000, 60_000];

interface QueueOptions {
  storageKey: string;
  retryDelaysMs?: number[];
  onStatus?: (status: SaveStatus, pending: number) => void;
  onSubmitted?: (item: Extract<PendingSave, { kind: 'submit' }>, result: SubmitResult) => void;
}

/** Same checkpoint slot = same game and mission; same settings slot = always. */
function sameSlot(a: PendingSave, b: PendingSave): boolean {
  if (a.kind === 'checkpoint' && b.kind === 'checkpoint') {
    return (
      a.checkpoint.game === b.checkpoint.game && a.checkpoint.missionId === b.checkpoint.missionId
    );
  }
  return a.kind === 'settings' && b.kind === 'settings';
}

/**
 * Sends saves to the bridge one by one, in order. Failed saves stay in the
 * queue (kept in localStorage, so a refresh does not lose them) and are retried
 * with a growing delay. Only the latest checkpoint per mission is kept.
 */
export class SaveQueue {
  private items: PendingSave[];
  private running: Promise<void> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;

  constructor(
    private readonly bridge: LabsBridge,
    private readonly store: KeyValueStore,
    private readonly options: QueueOptions,
  ) {
    this.items = readJson<PendingSave[]>(store, options.storageKey) ?? [];
  }

  get pending(): number {
    return this.items.length;
  }

  enqueue(item: PendingSave): Promise<void> {
    const index = this.items.findIndex((existing) => sameSlot(existing, item));
    if (index >= 0) this.items[index] = item;
    else this.items.push(item);
    this.persist();
    return this.flush();
  }

  /** Sends everything now. Resolves when the queue is empty or a save failed. */
  flush(): Promise<void> {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.running ??= this.drain().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  dispose(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private async drain(): Promise<void> {
    while (this.items.length) {
      const item = this.items[0];
      this.report('saving');
      try {
        await this.send(item);
      } catch (error) {
        if (isRetryable(error)) {
          this.scheduleRetry();
          return;
        }
        // The server refused this save (bad data, too large...): retrying cannot help.
        console.warn('[labs] save dropped', item.kind, error);
      }
      // A newer checkpoint may have replaced the item while it was being sent.
      if (this.items[0] === item) this.items.shift();
      this.failures = 0;
      this.persist();
    }
    this.report('saved');
  }

  private async send(item: PendingSave): Promise<void> {
    if (item.kind === 'checkpoint') {
      await this.bridge.saveCheckpoint(item.checkpoint);
    } else if (item.kind === 'settings') {
      await this.bridge.saveSettings(item.settings);
    } else {
      const result = await this.bridge.submitMission(
        item.game,
        item.missionId,
        item.answer,
        item.stats,
      );
      this.options.onSubmitted?.(item, result);
    }
  }

  private scheduleRetry(): void {
    const delays = this.options.retryDelaysMs ?? RETRY_DELAYS_MS;
    const delay = delays[Math.min(this.failures, delays.length - 1)];
    this.failures++;
    this.report('retrying');
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.flush();
    }, delay);
  }

  private persist(): void {
    if (this.items.length) writeJson(this.store, this.options.storageKey, this.items);
    else this.store.remove(this.options.storageKey);
  }

  private report(status: SaveStatus): void {
    this.options.onStatus?.(status, this.items.length);
  }
}
