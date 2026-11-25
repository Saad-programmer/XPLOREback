import { browserStore } from '../storage';
import { ApiBridge } from './api-bridge';
import { MockBridge } from './mock-bridge';
import { SupabaseBridge } from './supabase-bridge';
import type { LabsBridge } from './types';

export * from './types';

let bridge: LabsBridge | null = null;

/** The bridge picked by NEXT_PUBLIC_LABS_BRIDGE. Browser only. */
export function getBridge(): LabsBridge {
  if (!bridge) {
    const mode = process.env.NEXT_PUBLIC_LABS_BRIDGE;
    bridge =
      mode === 'api'
        ? new ApiBridge(process.env.NEXT_PUBLIC_LABS_API_URL ?? '')
        : mode === 'supabase'
          ? new SupabaseBridge()
          : new MockBridge(browserStore());
  }
  return bridge;
}
