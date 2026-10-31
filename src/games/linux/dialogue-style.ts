import type { Mood } from './content/schema';
import type { Dialogue } from './game-store';

/**
 * Colour family of a dialogue line. The CSS turns it into colours:
 * `zone` uses the zone colour on the rail and the name tag only, the others colour the whole box.
 */
export type DialogueTone = 'zone' | 'hint' | 'mistake' | 'victory';
export type DialogueIcon = 'hint' | 'mistake' | 'victory' | null;

/** Moods that mean the player made a mistake (the rest are jokes or comments). */
const MISTAKE_MOODS: readonly Mood[] = ['shocked', 'disappointed'];

/** How the dialogue box shows a line (HANDOFF T1, PRD section 6). */
export function dialogueStyle(
  kind: Dialogue['kind'],
  mood: Mood,
): { tone: DialogueTone; icon: DialogueIcon } {
  switch (kind) {
    case 'hint':
      return { tone: 'hint', icon: 'hint' };
    case 'victory':
      return { tone: 'victory', icon: 'victory' };
    case 'reaction':
      return MISTAKE_MOODS.includes(mood)
        ? { tone: 'mistake', icon: 'mistake' }
        : { tone: 'zone', icon: null };
    case 'briefing':
    case 'info':
      return { tone: 'zone', icon: null };
  }
}
