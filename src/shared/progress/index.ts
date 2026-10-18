'use client';

import { useStore } from 'zustand';
import { getBridge } from '../bridge';
import { browserStore } from '../storage';
import { createProgressStore, type ProgressState, type ProgressStore } from './progress-store';

export * from './progress-store';
export type { SaveStatus } from './save-queue';

let progressStore: ProgressStore | null = null;

/** The app-wide progress store (browser only). */
export function getProgressStore(): ProgressStore {
  progressStore ??= createProgressStore({ bridge: getBridge(), store: browserStore() });
  return progressStore;
}

/** React hook: `const status = useProgress((s) => s.saveStatus)`. */
export function useProgress<T>(selector: (state: ProgressState) => T): T {
  return useStore(getProgressStore(), selector);
}
