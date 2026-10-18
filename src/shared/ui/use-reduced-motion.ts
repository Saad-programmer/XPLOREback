'use client';

import { useProgress } from '../progress';

/** Reduced motion from the player's settings or the operating system. */
export function useReducedMotion(): boolean {
  const fromSettings = useProgress((state) => state.settings.reducedMotion);
  if (fromSettings) return true;
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
