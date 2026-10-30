/**
 * Cuts Pixel's expression sheet into one small image per mood.
 *
 *   node scripts/cut-mascot.mjs
 *
 * Source: public/games/linux/characters/pixel/source/ (AI art, see PRD section 6).
 * Output: public/games/linux/characters/pixel/face-<mood>.webp and body-<pose>.webp.
 * Run it again after replacing the source art; the game only uses the output files.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const DIR = 'public/games/linux/characters/pixel';
const SHEET = join(DIR, 'source/Penguin Expression.png');
const PROUD = join(DIR, 'source/penguin-proud.png');

/** Faces are drawn up to 96 CSS px: 256 px covers high-density screens. */
const FACE = 256;
/** Every head is scaled to this width, so all moods have the same size. */
const HEAD_WIDTH = 216;
const BODY_HEIGHT = 384;

/** Figures on the sheet, in reading order (found by `findFigures`). */
const SHEET_FIGURES = [
  'body-idle',
  'face-neutral',
  'face-happy',
  'face-thinking',
  'face-shocked',
  null, // "determined": not one of the game's moods (kept in the source sheet)
  'face-disappointed',
  'face-laughing',
  'face-sleeping',
  'body-typing',
];

/** Bounding boxes of the opaque figures: alpha mask at 1/4 scale, then flood fill. */
async function findFigures(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const K = 4;
  const W = Math.ceil(info.width / K);
  const H = Math.ceil(info.height / K);
  const mask = new Uint8Array(W * H);
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) mask[((y / K) | 0) * W + ((x / K) | 0)] = 1;

  const seen = new Uint8Array(W * H);
  const boxes = [];
  for (let start = 0; start < W * H; start++) {
    if (!mask[start] || seen[start]) continue;
    const stack = [start];
    seen[start] = 1;
    let minX = W,
      minY = H,
      maxX = 0,
      maxY = 0,
      area = 0;
    while (stack.length) {
      const p = stack.pop();
      const x = p % W;
      const y = (p / W) | 0;
      area++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      for (const q of [p - 1, p + 1, p - W, p + W]) {
        if (q < 0 || q >= W * H || seen[q] || !mask[q] || Math.abs((q % W) - x) > 1) continue;
        seen[q] = 1;
        stack.push(q);
      }
    }
    // Small pieces (the "zzz" of the sleeping face) are not figures.
    if (area > 200)
      boxes.push({
        left: minX * K,
        top: minY * K,
        width: (maxX - minX + 1) * K,
        height: (maxY - minY + 1) * K,
      });
  }
  // Reading order: rows of about 300 px, then left to right.
  return boxes.sort((a, b) => Math.round(a.top / 300) - Math.round(b.top / 300) || a.left - b.left);
}

/** Makes nearly opaque pixels fully opaque (the generator exports them at ~96%). */
async function solidify(image) {
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) if (data[i] >= 200) data[i] = 255;
  return sharp(data, { raw: info });
}

/**
 * A head on a square canvas: same width for every mood, centred, sitting on the
 * bottom edge (the hoodie is cut there). `extra` widens the cut area upward and
 * to the right, for the sleeping "zzz".
 */
async function face(file, box, out, extra = { top: 0, right: 0 }) {
  const meta = await sharp(file).metadata();
  const area = {
    left: box.left,
    top: Math.max(0, box.top - extra.top),
    width: Math.min(meta.width - box.left, box.width + extra.right),
    height: box.height + Math.min(box.top, extra.top),
  };
  const scale = HEAD_WIDTH / box.width;
  const cut = await (
    await solidify(sharp(file).extract(area))
  )
    .resize(Math.round(area.width * scale), Math.round(area.height * scale))
    .png()
    .toBuffer();
  const cutMeta = await sharp(cut).metadata();
  // Keep the head centred even when the cut area is wider (zzz on the right).
  const left = Math.round((FACE - HEAD_WIDTH) / 2);
  const top = Math.max(0, FACE - cutMeta.height);
  const fitted = await sharp(cut)
    .extract({
      left: 0,
      top: Math.max(0, cutMeta.height - FACE),
      width: Math.min(cutMeta.width, FACE - left),
      height: Math.min(cutMeta.height, FACE),
    })
    .toBuffer();
  await sharp({
    create: { width: FACE, height: FACE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: fitted, left, top }])
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(join(DIR, `${out}.webp`));
}

async function body(file, box, out) {
  await (
    await solidify(sharp(file).extract(box))
  )
    .resize({ height: BODY_HEIGHT })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(join(DIR, `${out}.webp`));
}

mkdirSync(DIR, { recursive: true });
const figures = await findFigures(SHEET);
if (figures.length !== SHEET_FIGURES.length)
  throw new Error(`Expected ${SHEET_FIGURES.length} figures on the sheet, found ${figures.length}`);

for (const [index, name] of SHEET_FIGURES.entries()) {
  if (!name) continue;
  const box = figures[index];
  if (name.startsWith('body-')) await body(SHEET, box, name);
  else if (name === 'face-sleeping') await face(SHEET, box, name, { top: 44, right: 14 });
  else await face(SHEET, box, name);
}

const [proud] = await findFigures(PROUD);
await face(PROUD, proud, 'face-proud');
console.log('Pixel: faces and bodies written to', DIR);
