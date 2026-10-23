/**
 * The title screen galaxy, as data (PRD section 8).
 *
 * Idea: a server seen from very far away. Thousands of seeded particles settle
 * along logarithmic spiral arms; scatter shrinks toward the rim so the arms read
 * clearly, colour cools from a warm core to blue and violet edges, and a few pink
 * knots mark young stars. The same seed always gives the same galaxy, so the
 * title screen looks identical on every visit. The core's glow breathes at the
 * tempo of a blinking terminal cursor (530 ms on, 530 ms off).
 *
 * This file is pure (no DOM), so it is unit-tested; Galaxy.tsx draws it.
 */

import { createRng, type Rng } from '@/src/shared/random';

export { createRng, type Rng };

/** Normal distribution (Box-Muller), mean 0, deviation 1. */
export function gaussian(rng: Rng): number {
  const u = 1 - rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

export const GALAXY_COLORS = {
  core: [255, 233, 244],
  inner: [122, 162, 247],
  outer: [187, 154, 247],
  knot: [247, 161, 196],
  dust: [125, 207, 255],
} as const;

type Rgb = readonly [number, number, number];

function mix(a: Rgb, b: Rgb, t: number): [number, number, number] {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as [number, number, number];
}

export interface GalaxyParticle {
  /** Position in the galaxy plane, unit radius (before rotation and tilt). */
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: [number, number, number];
}

export interface GalaxyParams {
  seed: number;
  count: number;
  arms: number;
  /** How tightly the arms wind. */
  windiness: number;
  /** Angular spread of a star around its arm, at the centre. */
  spread: number;
  /** Share of pink star-forming knots. */
  knots: number;
}

export const DEFAULT_GALAXY: GalaxyParams = {
  seed: 1991, // the year Linux was announced
  count: 7000,
  arms: 3,
  windiness: 2.7,
  spread: 0.42,
  knots: 0.05,
};

export function generateGalaxy(params: GalaxyParams = DEFAULT_GALAXY): GalaxyParticle[] {
  const rng = createRng(params.seed);
  const particles: GalaxyParticle[] = [];
  for (let i = 0; i < params.count; i++) {
    // Most stars near the centre, thinning out exponentially toward the rim.
    const r = Math.min(1, -Math.log(1 - rng() * 0.985) / 3.4);
    const haze = rng() < 0.18;
    const arm = i % params.arms;
    const armAngle = (arm / params.arms) * Math.PI * 2 + Math.log(r + 0.06) * params.windiness;
    const angle = haze
      ? rng() * Math.PI * 2
      : armAngle + gaussian(rng) * params.spread * (1 - r * 0.55);
    const radius = Math.max(0, r + gaussian(rng) * 0.035);
    const knot = !haze && r > 0.2 && rng() < params.knots;

    let color: [number, number, number];
    if (knot) color = [...GALAXY_COLORS.knot];
    else if (haze) color = [...GALAXY_COLORS.dust];
    else if (r < 0.12) color = mix(GALAXY_COLORS.core, GALAXY_COLORS.inner, r / 0.12);
    else color = mix(GALAXY_COLORS.inner, GALAXY_COLORS.outer, Math.min(1, (r - 0.12) / 0.7));

    particles.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: knot ? 2 + rng() * 2 : 0.8 + rng() * (1.9 - r * 0.8),
      alpha: haze ? 0.08 + rng() * 0.12 : (0.25 + 0.65 * Math.sqrt(1 - r)) * (0.6 + rng() * 0.4),
      color,
    });
  }
  return particles;
}

export interface Star {
  /** 0 to 1, relative to the screen. */
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
}

export interface StarLayer {
  stars: Star[];
  /** How much the layer follows the mouse (parallax). */
  depth: number;
}

/** Three star layers: far and many, near and few (PRD: 2 to 3 parallax layers). */
export function generateStarLayers(seed: number): StarLayer[] {
  const rng = createRng(seed ^ 0x9e3779b9);
  const layers: [number, number, number][] = [
    [260, 0.6, 0.008],
    [120, 1.0, 0.02],
    [40, 1.6, 0.045],
  ];
  return layers.map(([count, size, depth]) => ({
    depth,
    stars: Array.from({ length: count }, () => ({
      x: rng(),
      y: rng(),
      size: size * (0.6 + rng() * 0.8),
      alpha: 0.3 + rng() * 0.6,
      twinkleSpeed: 0.6 + rng() * 2.2,
      phase: rng() * Math.PI * 2,
    })),
  }));
}

/** Smooth 0..1 wave with the period of a terminal cursor blink (2 × 530 ms). */
export function cursorPulse(timeS: number): number {
  return 0.5 + 0.5 * Math.cos((2 * Math.PI * timeS) / 1.06);
}
