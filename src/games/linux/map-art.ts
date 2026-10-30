import type { StaticImageData } from 'next/image';
import archive from '@/public/games/linux/map/archive.webp';
import detective from '@/public/games/linux/map/detective.webp';
import guardedVault from '@/public/games/linux/map/guarded-vault.webp';
import pipeFactory from '@/public/games/linux/map/pipe-factory.webp';
import searchHall from '@/public/games/linux/map/search-hall.webp';
import wakeUpRoom from '@/public/games/linux/map/wake-up-room.webp';
import pixel from '@/public/games/linux/characters/pixel/body-idle.webp';
import type { ZoneId } from './meta';

/** One floating island per zone (scripts/process-map.mjs), imported so next/image can size them. */
export const ISLAND_ART: Record<ZoneId, StaticImageData> = {
  'wake-up-room': wakeUpRoom,
  archive,
  'search-hall': searchHall,
  'pipe-factory': pipeFactory,
  'guarded-vault': guardedVault,
  detective,
};

/** Pixel standing on the current level. */
export const PIXEL_STANDING = pixel;
