import type { Howl } from 'howler';
import { asset } from '../asset';
import type { Settings } from '../bridge/types';

export type SoundCategory = 'effect' | 'meme' | 'voice';

const VOLUME: Record<SoundCategory, number> = { effect: 0.7, meme: 0.8, voice: 0.3 };

export interface SoundPlayer {
  /** `name` is a file under the game's sounds/ folder (`ding`) or a path like `sounds/x.mp3`. */
  play(name: string, category: SoundCategory): void;
}

/**
 * Sound effects with Howler (PRD section 7). Nothing plays when muted, meme
 * sounds have their own switch, and Howler is only downloaded on first use.
 */
export function createSoundPlayer(gameFolder: string, getSettings: () => Settings): SoundPlayer {
  const cache = new Map<string, Howl>();
  let howler: Promise<typeof import('howler')> | null = null;

  return {
    play(name, category) {
      const settings = getSettings();
      if (settings.muted || (category === 'meme' && !settings.memeSounds)) return;
      if (typeof window === 'undefined') return;
      const file = name.includes('/') ? name : `sounds/${name}.wav`;
      const src = asset(`games/${gameFolder}/${file}`);
      howler ??= import('howler');
      void howler.then(({ Howl }) => {
        let sound = cache.get(src);
        if (!sound) {
          sound = new Howl({ src: [src], volume: VOLUME[category] });
          cache.set(src, sound);
        }
        sound.play();
      });
    },
  };
}
