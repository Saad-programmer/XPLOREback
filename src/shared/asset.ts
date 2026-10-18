/** Path prefix of the app on the Xplore domain (Next.js Multi-Zones). */
export const BASE_PATH = '/labs';

/**
 * Builds the URL of a file in `public/`. Next.js adds `basePath` to links and
 * router paths, but not to raw URLs used by audio, images, Rive files or fetch.
 *
 * asset('games/linux/sounds/ding.mp3') -> '/labs/games/linux/sounds/ding.mp3'
 */
export function asset(path: string): string {
  return `${BASE_PATH}/${path.replace(/^\/+/, '')}`;
}
