import { about as linuxAbout, missions as linuxMissions } from '@/src/games/linux/content';
import type { GameId } from '../bridge/types';

/**
 * Server-side facts for the game details page: the "More info" Markdown and the
 * number of missions. Kept out of the hub bundle (it loads the game content).
 */
export const GAME_ABOUT: Partial<
  Record<GameId, { about: { en: string; fr: string }; missions: number }>
> = {
  linux: { about: linuxAbout, missions: linuxMissions.length },
};
