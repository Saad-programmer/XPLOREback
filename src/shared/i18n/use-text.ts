'use client';

import { useProgress } from '../progress';
import { pickText, type LocalizedText } from './text';

/** Picks the text in the player's language. */
export function useText(): (text: LocalizedText) => string {
  const lang = useProgress((state) => state.settings.language);
  return (text) => pickText(text, lang);
}
