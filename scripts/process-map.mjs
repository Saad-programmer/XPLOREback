/**
 * Turns the AI island art into the images of the mission map.
 *
 *   node scripts/process-map.mjs
 *
 * Source: design/linux/map/island-<name>.png (1254 px, about 2 MB each; not deployed).
 * Output: public/games/linux/map/<zone-id>.webp: fully opaque, trimmed, the same
 * margin around every island, 720 px (shown up to about 360 px wide).
 */
import { join } from 'node:path';
import sharp from 'sharp';

const DIR = 'public/games/linux/map';
const SOURCE = 'design/linux/map';
const SIZE = 720;
/** Empty space around the island, as a share of the image. */
const MARGIN = 0.04;

/** Source file -> zone id (src/games/linux/meta.ts). */
const ISLANDS = {
  'island-wake-up.png': 'wake-up-room',
  'island-archive.png': 'archive',
  'island-search-hall.png': 'search-hall',
  'island-pipe-factory.png': 'pipe-factory',
  'island-guarded-vault.png': 'guarded-vault',
  'island-detective.png': 'detective',
};

for (const [file, zone] of Object.entries(ISLANDS)) {
  const { data, info } = await sharp(join(SOURCE, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // The generator exports the island at ~96% opacity, and a few stray pixels at 1-16.
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= 200) data[i] = 255;
    else if (data[i] <= 16) data[i] = 0;
  }
  const trimmed = await sharp(data, { raw: info }).trim({ threshold: 0 }).png().toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const side = Math.round(Math.max(width, height) / (1 - 2 * MARGIN));
  // Two steps: sharp resizes before it composites inside one pipeline.
  const square = await sharp({
    create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: trimmed, gravity: 'centre' }])
    .png()
    .toBuffer();
  await sharp(square)
    .resize(SIZE, SIZE)
    .webp({ quality: 86, alphaQuality: 100 })
    .toFile(join(DIR, `${zone}.webp`));
  console.log(`${zone}.webp`);
}
