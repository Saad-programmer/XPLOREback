/**
 * Turns the AI cursor sheet into the site's pixel-art cursors.
 *
 *   node scripts/make-cursors.mjs
 *
 * Source: design/cursors/cursors-sheet.png (4 cursors side by side: default,
 * pointer, locked, busy). The generator does not draw on an exact pixel grid,
 * so each cursor is shrunk at one shared scale and every pixel is snapped to
 * the sheet's palette: crisp pixel art, no blur.
 * Output: public/brand/cursors/<name>.png (32 px) and <name>@2x.png (64 px).
 * Hotspots (the click point) are printed; they must match app/site.css and
 * globals.css.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SOURCE = 'design/cursors/cursors-sheet.png';
const OUT = 'public/brand/cursors';
const SIZE = 32;
/** Size of one art pixel on the sheet, in sheet pixels (measured from its colour runs). */
const ART_PIXEL = 14.8;
const NAMES = ['default', 'pointer', 'locked', 'busy'];

const PALETTE = {
  navy: [11, 31, 59],
  blue: [29, 99, 238],
  white: [255, 255, 255],
  light: [54, 194, 255],
  gold: [255, 170, 51],
  deep: [27, 49, 146],
};
/** Gold is only for the padlock: elsewhere, blended edges must not snap to it. */
const colorsFor = (name) =>
  Object.entries(PALETTE)
    .filter(([key]) => key !== 'gold' || name === 'locked')
    .map(([, color]) => color);

function nearest([r, g, b], colors) {
  let best = colors[0];
  let bestDistance = Infinity;
  for (const color of colors) {
    const d = (r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2;
    if (d < bestDistance) [best, bestDistance] = [color, d];
  }
  return best;
}

/** Bounding boxes of the opaque figures, left to right. */
async function findFigures() {
  const { data, info } = await sharp(SOURCE)
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
    if (area > 100)
      boxes.push({
        left: Math.max(0, minX * K - K),
        top: Math.max(0, minY * K - K),
        width: Math.min(info.width - minX * K + K, (maxX - minX + 3) * K),
        height: Math.min(info.height - minY * K + K, (maxY - minY + 3) * K),
      });
  }
  return boxes.sort((a, b) => a.left - b.left);
}

/** One cursor as a small pixel grid: [r, g, b] per opaque pixel, null when transparent. */
async function shrink(box, name) {
  const colors = colorsFor(name);
  const width = Math.round(box.width / ART_PIXEL);
  const height = Math.round(box.height / ART_PIXEL);
  const { data } = await sharp(SOURCE)
    .extract(box)
    .resize(width, height, { kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      row.push(data[i + 3] >= 128 ? nearest([data[i], data[i + 1], data[i + 2]], colors) : null);
    }
    rows.push(row);
  }
  // Trim empty rows and columns.
  while (rows.length && rows[0].every((p) => !p)) rows.shift();
  while (rows.length && rows.at(-1).every((p) => !p)) rows.pop();
  const used = (x) => rows.some((row) => row[x]);
  let first = 0;
  while (!used(first)) first++;
  let last = rows[0].length - 1;
  while (!used(last)) last--;
  return rows.map((row) => row.slice(first, last + 1));
}

const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * The generated padlock's keyhole reads as a cross: repaint the padlock body
 * gold and draw a classic keyhole (round top, slot below) in its centre.
 */
function fixKeyhole(grid) {
  const gold = PALETTE.gold;
  let minX = Infinity,
    minY = Infinity,
    maxX = -1,
    maxY = -1;
  grid.forEach((row, y) =>
    row.forEach((p, x) => {
      if (!same(p, gold)) return;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }),
  );
  if (maxX < 0) return grid;
  // The body is the lower part of the gold area (the shackle is above it).
  const bodyTop = Math.round(minY + (maxY - minY) * 0.4);
  for (let y = bodyTop + 1; y < maxY; y++)
    for (let x = minX + 1; x < maxX; x++)
      if (grid[y][x] && !same(grid[y][x], PALETTE.white)) grid[y][x] = gold;
  const cx = Math.round((minX + maxX) / 2);
  const cy = Math.round((bodyTop + maxY) / 2);
  const navy = PALETTE.navy;
  for (const [dx, dy] of [
    [0, -1],
    [-1, -1],
    [0, 0],
    [-1, 0],
    [0, 1],
    [0, 2],
  ]) {
    const x = cx + dx;
    const y = cy + dy - 1;
    if (grid[y]?.[x]) grid[y][x] = navy;
  }
  return grid;
}

/** Places the grid on a 32 x 32 canvas so the hotspot pixel lands where we want it. */
function place(grid, name) {
  const height = grid.length;
  const width = grid[0].length;
  if (width > SIZE || height > SIZE)
    throw new Error(`${name}: ${width}x${height} is larger than ${SIZE}`);
  let left;
  let top;
  let hotspot;
  if (name === 'busy') {
    left = Math.floor((SIZE - width) / 2);
    top = Math.floor((SIZE - height) / 2);
    hotspot = { x: SIZE / 2, y: SIZE / 2 };
  } else {
    // Arrows: the tip (first opaque pixel of the top row) at (1, 1).
    // Pointer: the fingertip at the top, the hand centred around it.
    const tipX = grid[0].findIndex(Boolean);
    left = name === 'pointer' ? Math.floor((SIZE - width) / 2) : 1 - tipX;
    top = 1;
    hotspot = { x: left + tipX, y: 1 };
  }
  const pixels = Buffer.alloc(SIZE * SIZE * 4);
  grid.forEach((row, y) =>
    row.forEach((p, x) => {
      if (!p) return;
      const i = ((top + y) * SIZE + left + x) * 4;
      pixels.set([...p, 255], i);
    }),
  );
  return { pixels, hotspot };
}

mkdirSync(OUT, { recursive: true });
const boxes = await findFigures();
if (boxes.length !== NAMES.length)
  throw new Error(`Expected ${NAMES.length} cursors, found ${boxes.length}`);
for (const [index, name] of NAMES.entries()) {
  let grid = await shrink(boxes[index], name);
  if (name === 'locked') grid = fixKeyhole(grid);
  const { pixels, hotspot } = place(grid, name);
  const raw = { raw: { width: SIZE, height: SIZE, channels: 4 } };
  await sharp(pixels, raw)
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, `${name}.png`));
  await sharp(pixels, raw)
    .resize(SIZE * 2, SIZE * 2, { kernel: 'nearest' })
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, `${name}@2x.png`));
  console.log(`${name}.png  ${grid[0].length}x${grid.length}  hotspot ${hotspot.x} ${hotspot.y}`);
}
