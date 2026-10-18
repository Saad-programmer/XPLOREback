'use client';

import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
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

export { useText } from '@/src/shared/i18n/use-text';

export { useReducedMotion } from '@/src/shared/ui/use-reduced-motion';
