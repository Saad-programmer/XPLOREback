import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { MOODS } from '@/src/games/linux/content/schema';

const DIR = join(process.cwd(), 'public/games/linux/characters/pixel');

describe('Pixel, the mascot', () => {
  it('has one face per mood the missions can use', async () => {
    for (const mood of MOODS) {
      const file = join(DIR, `face-${mood}.webp`);
      expect(existsSync(file), `face-${mood}.webp`).toBe(true);
      const { width, height, hasAlpha } = await sharp(file).metadata();
      expect([width, height, hasAlpha]).toEqual([256, 256, true]);
    }
  });

  it('keeps the faces light', () => {
    for (const mood of MOODS) {
      expect(statSync(join(DIR, `face-${mood}.webp`)).size).toBeLessThan(40_000);
    }
  });
});
