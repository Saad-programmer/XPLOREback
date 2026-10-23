/**
 * The website background, as data: a calm field of stars drifting through the
 * brand's deep blue, like a dimmed view of the title screen's galaxy.
 *
 * Stars live on a square tile that repeats across the screen, so the density is
 * the same on a phone and on a wide monitor, and nothing is generated again on
 * resize. Three layers at different depths drift and follow the scroll at
 * different speeds (parallax). A few near stars are pixel sparkles, like the
 * mosaic of the Xplore X.
 *
 * This file is pure (no DOM), so it is unit-tested; Starfield.tsx draws it.
 */
import { createRng } from '../random';

/** Size of the repeating star tile, in CSS pixels. */
export const STAR_TILE = 900;

/** Drift speed of the nearest layer, in CSS pixels per second (far layers are slower). */
export const DRIFT_SPEED = { x: -7, y: -3 };

export interface FieldStar {
  /** Position in the tile, 0 to STAR_TILE. */
  x: number;
  y: number;
  /** 0 (far, slow) to 1 (near, fast). */
  depth: number;
  size: number;
  alpha: number;
  /** Twinkles per second (radians). */
  twinkleSpeed: number;
  phase: number;
  /** Drawn as a small pixel "+" instead of a dot. */
  sparkle: boolean;
  color: readonly [number, number, number];
}

const STAR_COLORS = {
  white: [222, 230, 255],
  blue: [122, 162, 247],
  violet: [187, 154, 247],
  pink: [247, 161, 196],
} as const;

/** [count, depth, size] per layer: far and many, near and few. */
const LAYERS: [number, number, number][] = [
  [150, 0.15, 1],
  [60, 0.4, 1.5],
  [14, 0.8, 2],
];

export function generateStarfield(seed = 2026): FieldStar[] {
  const rng = createRng(seed);
  return LAYERS.flatMap(([count, depth, size]) =>
    Array.from({ length: count }, () => {
      const near = depth > 0.5;
      const sparkle = near && rng() < 0.6;
      const tint = rng();
      const color = !near
        ? STAR_COLORS.white
        : tint < 0.5
          ? STAR_COLORS.blue
          : tint < 0.8
            ? STAR_COLORS.violet
            : STAR_COLORS.pink;
      return {
        x: rng() * STAR_TILE,
        y: rng() * STAR_TILE,
        depth,
        size: size * (0.7 + rng() * 0.6),
        alpha: (near ? 0.55 : 0.25) + rng() * 0.4,
        twinkleSpeed: 0.4 + rng() * 1.6,
        phase: rng() * Math.PI * 2,
        sparkle,
        color,
      };
    }),
  );
}

/** Where a star is on screen at `timeS`, scrolled by `scrollY`: always inside the tile. */
export function starPosition(star: FieldStar, timeS: number, scrollY: number) {
  const wrap = (value: number) => ((value % STAR_TILE) + STAR_TILE) % STAR_TILE;
  return {
    x: wrap(star.x + DRIFT_SPEED.x * star.depth * timeS),
    y: wrap(star.y + DRIFT_SPEED.y * star.depth * timeS - scrollY * star.depth * 0.3),
  };
}

/** Brightness between 0.55 and 1 times the star's alpha. */
export function twinkle(star: FieldStar, timeS: number): number {
  return star.alpha * (0.775 + 0.225 * Math.sin(timeS * star.twinkleSpeed + star.phase));
}
