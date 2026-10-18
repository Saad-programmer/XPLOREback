'use client';

import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import { pickText, type LocalizedText } from '@/src/shared/i18n/text';
import { useProgress } from '@/src/shared/progress';
import type { GameState, GameStore } from '../game-store';

export const GameContext = createContext<GameStore | null>(null);

export function useGameStore(): GameStore {
  const store = useContext(GameContext);
  if (!store) throw new Error('useGame must be used inside <GameContext>');
  return store;
}

export function useGame<T>(selector: (state: GameState) => T): T {
  return useStore(useGameStore(), selector);
}

/** Picks the text in the player's language. */
export function useText(): (text: LocalizedText) => string {
  const lang = useProgress((state) => state.settings.language);
  return (text) => pickText(text, lang);
}

/** Reduced motion from the player's settings or the operating system. */
export function useReducedMotion(): boolean {
  const fromSettings = useProgress((state) => state.settings.reducedMotion);
  if (fromSettings) return true;
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
