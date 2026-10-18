import { getProgressStore } from '@/src/shared/progress';
import { createSoundPlayer } from '@/src/shared/sound';

/** Sounds of the Linux game, following the player's mute and meme sounds settings. */
export const linuxSound = createSoundPlayer('linux', () => getProgressStore().getState().settings);
