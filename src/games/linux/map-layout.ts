import type { MissionResult } from '@/src/shared/bridge/types';
import type { ZoneId } from './meta';
import type { MapMission, MapZone } from './mission-map';

/**
 * Where things go on the mission map (PRD section 8): one floating island per
 * zone, mission nodes on each island's free floor, and a route linking them in
 * campaign order. Two layouts: `wide` (computers, left to right like the
 * concept art) and `tall` (phones, a zigzag read from top to bottom).
 * Coordinates are scene units; the page scales the scene to its width.
 */

export type LayoutName = 'wide' | 'tall';

export interface Point {
  x: number;
  y: number;
}

interface IslandPlace extends Point {
  /** Side of the island image (square), centred on x, y. */
  size: number;
}

interface Layout {
  width: number;
  height: number;
  /** Route curves: horizontal S-curves on wide screens, vertical on phones. */
  flow: 'horizontal' | 'vertical';
  islands: Record<ZoneId, IslandPlace>;
}

export const LAYOUTS: Record<LayoutName, Layout> = {
  wide: {
    width: 1600,
    height: 980,
    flow: 'horizontal',
    islands: {
      'wake-up-room': { x: 230, y: 690, size: 400 },
      archive: { x: 560, y: 420, size: 400 },
      'search-hall': { x: 880, y: 700, size: 400 },
      'pipe-factory': { x: 1180, y: 400, size: 400 },
      'guarded-vault': { x: 1390, y: 720, size: 400 },
      detective: { x: 1440, y: 170, size: 300 },
    },
  },
  tall: {
    width: 400,
    height: 2120,
    flow: 'vertical',
    islands: {
      'wake-up-room': { x: 150, y: 170, size: 260 },
      archive: { x: 255, y: 510, size: 260 },
      'search-hall': { x: 145, y: 850, size: 260 },
      'pipe-factory': { x: 255, y: 1190, size: 260 },
      'guarded-vault': { x: 150, y: 1530, size: 260 },
      detective: { x: 250, y: 1880, size: 200 },
    },
  },
};

/**
 * Free spots on each island's floor (0 to 1 inside the island image), one per
 * mission of the zone, in order. Read from the art: the front stone areas.
 * A zone with more missions than spots reuses the last spot (add spots first).
 */
export const NODE_SPOTS: Record<ZoneId, Point[]> = {
  'wake-up-room': [
    { x: 0.4, y: 0.58 },
    { x: 0.63, y: 0.58 },
  ],
  archive: [
    { x: 0.33, y: 0.6 },
    { x: 0.51, y: 0.51 },
    { x: 0.71, y: 0.6 },
  ],
  'search-hall': [
    { x: 0.52, y: 0.62 },
    { x: 0.73, y: 0.57 },
  ],
  'pipe-factory': [
    { x: 0.38, y: 0.55 },
    { x: 0.6, y: 0.57 },
  ],
  'guarded-vault': [{ x: 0.5, y: 0.54 }],
  detective: [{ x: 0.6, y: 0.6 }],
};

/** Where the route crosses an island that has no mission yet. */
const ISLAND_CENTRE: Point = { x: 0.52, y: 0.55 };

export function spotOnIsland(layout: LayoutName, zone: ZoneId, spot: Point): Point {
  const island = LAYOUTS[layout].islands[zone];
  return {
    x: Math.round(island.x + (spot.x - 0.5) * island.size),
    y: Math.round(island.y + (spot.y - 0.5) * island.size),
  };
}

export function nodePosition(layout: LayoutName, zone: ZoneId, index: number): Point {
  const spots = NODE_SPOTS[zone];
  return spotOnIsland(layout, zone, spots[Math.min(index, spots.length - 1)]);
}

export type StopKind = 'mission' | 'future';

/** A point of the route: a mission node, or an island whose missions are coming. */
export interface RouteStop {
  kind: StopKind;
  zone: ZoneId;
  entry: MapMission | null;
  at: Record<LayoutName, Point>;
}

export type SegmentState = 'done' | 'open' | 'locked';

export interface RouteSegment {
  from: RouteStop;
  to: RouteStop;
  /** done: travelled; open: leads to the next mission; locked: still ahead. */
  state: SegmentState;
  /** The dotted side branch to the bonus island. */
  bonus: boolean;
}

/** The route in campaign order, through every island. */
export function routeOf(zones: MapZone[]): RouteStop[] {
  const at = (zone: ZoneId, point: (layout: LayoutName) => Point) => ({
    wide: point('wide'),
    tall: point('tall'),
  });
  return zones.flatMap(({ zone, missions }): RouteStop[] =>
    missions.length
      ? missions.map((entry, index) => ({
          kind: 'mission',
          zone: zone.id,
          entry,
          at: at(zone.id, (layout) => nodePosition(layout, zone.id, index)),
        }))
      : [
          {
            kind: 'future',
            zone: zone.id,
            entry: null,
            at: at(zone.id, (layout) => spotOnIsland(layout, zone.id, ISLAND_CENTRE)),
          },
        ],
  );
}

export function segmentsOf(route: RouteStop[]): RouteSegment[] {
  return route.slice(1).map((to, index) => {
    const from = route[index];
    const state: SegmentState =
      to.entry?.state === 'done' ? 'done' : to.entry?.state === 'open' ? 'open' : 'locked';
    return { from, to, state, bonus: to.zone === 'detective' };
  });
}

/** SVG path of one segment: an S-curve along the layout's flow. */
export function segmentPath(layout: LayoutName, from: Point, to: Point): string {
  if (LAYOUTS[layout].flow === 'horizontal') {
    const mid = (from.x + to.x) / 2;
    return `M${from.x} ${from.y}C${mid} ${from.y} ${mid} ${to.y} ${to.x} ${to.y}`;
  }
  const mid = (from.y + to.y) / 2;
  return `M${from.x} ${from.y}C${from.x} ${mid} ${to.x} ${mid} ${to.x} ${to.y}`;
}

/** Display only (points come from the server): 3 stars without hints, 2 with one, else 1. */
export function starsOf(result: MissionResult | null): 0 | 1 | 2 | 3 {
  if (!result) return 0;
  if (result.hintsUsed === 0) return 3;
  return result.hintsUsed === 1 ? 2 : 1;
}

/** Position as a share of the scene, for HTML elements placed over the SVG. */
export function percent(layout: LayoutName, point: Point) {
  const { width, height } = LAYOUTS[layout];
  return { left: (point.x / width) * 100, top: (point.y / height) * 100 };
}
