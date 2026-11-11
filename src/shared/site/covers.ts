import type { StaticImageData } from 'next/image';
import linuxCover from '@/public/games/linux/cover/capsule-art.jpg';
import sqlCover from '@/src/games/SQLGame/capsule-art.png';
import type { GameId } from '../bridge/types';

/**
 * Capsule art is imported statically so next/image knows the size, adds the
 * base path and serves resized versions.
 * The art already shows the game logo: never print the title over it.
 */
export const GAME_COVERS: Partial<Record<GameId, StaticImageData>> = {
  linux: linuxCover,
  sql: sqlCover,
};
