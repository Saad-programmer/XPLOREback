import { describe, expect, it } from 'vitest';
import { asset, BASE_PATH } from '@/src/shared/asset';

describe('asset', () => {
  it('prefixes public files with the base path', () => {
    expect(BASE_PATH).toBe('/labs');
    expect(asset('games/linux/sounds/ding.mp3')).toBe('/labs/games/linux/sounds/ding.mp3');
  });

  it('ignores leading slashes', () => {
    expect(asset('/games/linux/cover/card.png')).toBe('/labs/games/linux/cover/card.png');
  });
});
