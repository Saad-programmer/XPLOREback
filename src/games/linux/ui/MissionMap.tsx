'use client';

import { ArrowLeft, Lock, Terminal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { Progress as PixelProgress } from '@/src/shared/components/ui/8bit/progress';
import { cn } from '@/src/shared/lib/utils';
import { getProgressStore, useProgress } from '@/src/shared/progress';
import { missions } from '../content';
import { ISLAND_ART, PIXEL_STANDING } from '../map-art';
import {
  LAYOUTS,
  NODE_SPOTS,
  percent,
  routeOf,
  segmentPath,
  segmentsOf,
  starsOf,
  type LayoutName,
  type RouteSegment,
} from '../map-layout';
import { GAME_TITLE } from '../meta';
import { missionMap, type MapMission, type MapZone } from '../mission-map';
import { UI } from '../strings';
import { useText } from './game-context';
import { MissionPanel, Stars } from './MissionPanel';

/** Each island floats on its own rhythm. */
const FLOAT_DELAY = [0, -2.3, -4.1, -1.2, -5.4, -3.2];

const SEGMENT_STYLE: Record<RouteSegment['state'], string> = {
  done: 'stroke-ok [stroke-dasharray:10_4] animate-route-flow opacity-90',
  open: 'stroke-primary [stroke-dasharray:10_4] animate-route-flow',
  locked: 'stroke-faint/60 [stroke-dasharray:2_10]',
};

/** The route between the levels, drawn for one layout (only one is visible). */
function Route({ layout, segments }: { layout: LayoutName; segments: RouteSegment[] }) {
  const { width, height } = LAYOUTS[layout];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn(
        'pointer-events-none absolute inset-0 size-full',
        layout === 'wide' ? 'hidden md:block' : 'md:hidden',
      )}
      aria-hidden="true"
    >
      {segments.map((segment, index) => {
        const d = segmentPath(layout, segment.from.at[layout], segment.to.at[layout]);
        return (
          <g key={index} className={segment.bonus ? 'opacity-70' : undefined}>
            {/* Soft glow under the travelled and next parts of the route. */}
            {segment.state !== 'locked' && (
              <path
                d={d}
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                className={cn(segment.state === 'done' ? 'stroke-ok/20' : 'stroke-primary/25')}
              />
            )}
            <path
              d={d}
              fill="none"
              strokeWidth={segment.state === 'locked' ? 4 : 4.5}
              strokeLinecap="round"
              className={SEGMENT_STYLE[segment.state]}
            />
          </g>
        );
      })}
    </svg>
  );
}

function Node({ entry, boss, onOpen }: { entry: MapMission; boss: boolean; onOpen: () => void }) {
  const t = useText();
  const { mission, state, result, current } = entry;
  const label = t(state === 'done' ? UI.done : state === 'open' ? UI.open : UI.locked);

  return (
    <div className="flex flex-col items-center">
      {current && (
        <Image
          src={PIXEL_STANDING}
          alt={t(UI.youAreHere)}
          title={t(UI.youAreHere)}
          className="pointer-events-none -mb-1 h-12 w-auto animate-pixel-bob drop-shadow-[0_6px_6px_rgb(0_0_0/0.5)] motion-reduce:animate-none md:h-14"
        />
      )}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${mission.order}. ${t(mission.title)}: ${label}`}
        title={`${mission.order}. ${t(mission.title)}`}
        className={cn(
          'grid place-items-center rounded-full border-2 font-pixel shadow-[0_6px_14px_rgb(0_0_0/0.55)] transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:ring-4 focus-visible:ring-ring/60 focus-visible:outline-none',
          boss ? 'size-12 text-lg md:size-14' : 'size-10 text-base md:size-11',
          state === 'done' && 'border-ok bg-[#1d3b2a] text-ok',
          state === 'open' &&
            'animate-node-pulse border-primary bg-[#1b2a52] text-foreground motion-reduce:animate-none',
          state === 'locked' && 'border-faint/60 bg-deep/90 text-faint',
        )}
      >
        {state === 'locked' ? (
          <Lock className="size-4" aria-hidden="true" />
        ) : (
          <span aria-hidden="true">{mission.order}</span>
        )}
      </button>
      {state === 'done' && (
        <Stars
          count={starsOf(result)}
          className="mt-1 rounded-full bg-deep/80 px-1.5 py-0.5 [&_svg]:size-3"
        />
      )}
    </div>
  );
}

function Island({
  zone,
  index,
  onOpen,
}: {
  zone: MapZone;
  index: number;
  onOpen: (entry: MapMission) => void;
}) {
  const t = useText();
  const id = zone.zone.id;
  const place = (layout: LayoutName) => {
    const island = LAYOUTS[layout].islands[id];
    const { left, top } = percent(layout, island);
    return { left, top, width: (island.size / LAYOUTS[layout].width) * 100 };
  };
  const wide = place('wide');
  const tall = place('tall');
  const future = zone.missions.length === 0;
  const allLocked = !future && zone.missions.every((m) => m.state === 'locked');

  return (
    <li
      className="absolute top-(--tt) left-(--tl) w-(--tw) -translate-x-1/2 -translate-y-1/2 md:top-(--wt) md:left-(--wl) md:w-(--ww)"
      style={
        {
          '--wl': `${wide.left}%`,
          '--wt': `${wide.top}%`,
          '--ww': `${wide.width}%`,
          '--tl': `${tall.left}%`,
          '--tt': `${tall.top}%`,
          '--tw': `${tall.width}%`,
          '--zone': zone.zone.color,
        } as CSSProperties
      }
    >
      <div
        className="relative animate-island-float motion-reduce:animate-none"
        style={{ animationDelay: `${FLOAT_DELAY[index % FLOAT_DELAY.length]}s` }}
      >
        <Image
          src={ISLAND_ART[id]}
          alt=""
          priority={index < 2}
          sizes="(max-width: 767px) 65vw, 28vw"
          className={cn(
            'pointer-events-none h-auto w-full drop-shadow-[0_24px_30px_rgb(0_0_0/0.45)] select-none',
            future && 'opacity-80 saturate-50',
            allLocked && 'opacity-90 saturate-75',
          )}
        />
        {/* The nodes sit on the island's floor and float with it. */}
        {zone.missions.map((entry, n) => {
          const spot = NODE_SPOTS[id][Math.min(n, NODE_SPOTS[id].length - 1)];
          return (
            <div
              key={entry.mission.id}
              className="absolute -translate-x-1/2 -translate-y-[85%]"
              style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%` }}
            >
              <Node
                entry={entry}
                boss={n === NODE_SPOTS[id].length - 1}
                onOpen={() => onOpen(entry)}
              />
            </div>
          );
        })}
        <p
          className={cn(
            'absolute bottom-[6%] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-(--zone)/50 bg-deep/85 px-3 py-1 font-pixel text-xs whitespace-nowrap text-(--zone) backdrop-blur-sm md:text-sm',
            future && 'border-border text-muted-foreground',
          )}
        >
          {id === 'detective' && <span className="text-warn">{t(UI.bonus)} ·</span>}
          {t(zone.zone.title)}
          {future && (
            <span className="flex items-center gap-1 text-faint">
              · <Terminal className="size-3" aria-hidden="true" /> {t(UI.soon)}
            </span>
          )}
        </p>
      </div>
    </li>
  );
}

/**
 * The mission map (PRD section 8): one floating island per zone, the levels on
 * a glowing route, Pixel on the next one, and a panel per level with its recap.
 */
export function MissionMap() {
  const t = useText();
  const progress = useProgress((s) => s.progress.linux);
  const zones = missionMap(missions, progress);
  const segments = segmentsOf(routeOf(zones));
  const done = progress ? Object.keys(progress.missions).length : 0;
  const [openId, setOpenId] = useState<string | null>(null);
  const open = zones.flatMap((z) => z.missions).find((m) => m.mission.id === openId) ?? null;

  useEffect(() => {
    void getProgressStore()
      .getState()
      .loadProgress('linux')
      .catch(() => {});
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 sm:px-6">
      <Link
        href="/linux"
        className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t(UI.backToTitle)}
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-pixel text-sm text-primary">{GAME_TITLE}</p>
          <h1 className="mt-1 font-pixel text-3xl leading-tight font-semibold text-[#f2ecff] sm:text-4xl">
            {t(UI.missionMap)}
          </h1>
        </div>
        <div className="w-full sm:w-56">
          <p className="mb-2 text-right font-pixel text-sm text-warn">
            {done}/{missions.length} {t(UI.doneCount)}
          </p>
          <PixelProgress
            value={missions.length ? (done / missions.length) * 100 : 0}
            variant="retro"
            font="normal"
            progressBg="bg-ok"
            className="h-3"
            aria-label={`${done}/${missions.length}`}
          />
        </div>
      </header>

      <div
        className="relative mt-6 aspect-[400/2120] w-full md:-mx-[min(8vw,9rem)] md:aspect-[1600/980] md:w-[calc(100%+min(16vw,18rem))]"
        role="region"
        aria-label={t(UI.missionMap)}
      >
        <Route layout="wide" segments={segments} />
        <Route layout="tall" segments={segments} />
        <ol>
          {zones.map((zone, index) => (
            <Island
              key={zone.zone.id}
              zone={zone}
              index={index}
              onOpen={(entry) => setOpenId(entry.mission.id)}
            />
          ))}
        </ol>
      </div>

      <MissionPanel entry={open} onClose={() => setOpenId(null)} />
    </main>
  );
}
