import { browserStore } from '../storage';
import { ApiBridge } from './api-bridge';
import { MockBridge } from './mock-bridge';
import type { LabsBridge } from './types';

export * from './types';

let bridge: LabsBridge | null = null;

/** The bridge picked by NEXT_PUBLIC_LABS_BRIDGE: `mock` (default) or `api`. Browser only. */
export function getBridge(): LabsBridge {
  if (!bridge) {
    bridge =
      process.env.NEXT_PUBLIC_LABS_BRIDGE === 'api'
        ? new ApiBridge(process.env.NEXT_PUBLIC_LABS_API_URL ?? '')
        : new MockBridge(browserStore());
  }
  return bridge;
}
