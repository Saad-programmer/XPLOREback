import { describe, expect, it } from 'vitest';
import { MOODS } from '@/src/games/linux/content/schema';
import { dialogueStyle } from '@/src/games/linux/dialogue-style';

describe('dialogueStyle', () => {
  it('shows briefings and info lines in the zone colour, without icon', () => {
    for (const mood of MOODS) {
      expect(dialogueStyle('briefing', mood)).toEqual({ tone: 'zone', icon: null });
      expect(dialogueStyle('info', mood)).toEqual({ tone: 'zone', icon: null });
    }
  });

  it('shows hints in cyan with a lightbulb, whatever the mood', () => {
    expect(dialogueStyle('hint', 'thinking')).toEqual({ tone: 'hint', icon: 'hint' });
    expect(dialogueStyle('hint', 'shocked')).toEqual({ tone: 'hint', icon: 'hint' });
  });

  it('shows victory lines in gold with a star', () => {
    expect(dialogueStyle('victory', 'proud')).toEqual({ tone: 'victory', icon: 'victory' });
    expect(dialogueStyle('victory', 'laughing')).toEqual({ tone: 'victory', icon: 'victory' });
  });

  it('shows a reaction as a mistake only when Pixel is shocked or disappointed', () => {
    expect(dialogueStyle('reaction', 'shocked')).toEqual({ tone: 'mistake', icon: 'mistake' });
    expect(dialogueStyle('reaction', 'disappointed')).toEqual({
      tone: 'mistake',
      icon: 'mistake',
    });
    // A joke, e.g. reading the msemen recipe.
    expect(dialogueStyle('reaction', 'happy')).toEqual({ tone: 'zone', icon: null });
    expect(dialogueStyle('reaction', 'laughing')).toEqual({ tone: 'zone', icon: null });
  });
});
