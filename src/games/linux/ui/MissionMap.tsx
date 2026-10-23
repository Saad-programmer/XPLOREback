'use client';

import { ArrowLeft, Check, Lock, Play, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, type CSSProperties } from 'react';
import { Progress as PixelProgress } from '@/src/shared/components/ui/8bit/progress';
import { Badge } from '@/src/shared/components/ui/badge';
import { cn } from '@/src/shared/lib/utils';
import { getProgressStore, useProgress } from '@/src/shared/progress';
import { missions } from '../content';
import { GAME_TITLE } from '../meta';
import { missionMap, type MapMission } from '../mission-map';
import { UI } from '../strings';
import { useText } from './game-context';
import { Penguin } from './Penguin';

const STATE_STYLE = {
  done: 'border-ok/40 bg-ok/10 text-ok',
  open: 'border-(--zone)/50 bg-(--zone)/10 text-(--zone)',
  locked: 'border-border bg-transparent text-faint',
} as const;

function MissionCard({ entry }: { entry: MapMission }) {
  const t = useText();
  const { mission, state, result, needs, current } = entry;
  const label = state === 'done' ? UI.done : state === 'open' ? UI.open : UI.locked;
  const locked = state === 'locked';

  const body = (
    <>
      <span
        className={cn(
          'text-center font-pixel text-3xl leading-none sm:w-10',
          locked ? 'text-faint' : 'text-(--zone)',
        )}
        aria-hidden="true"
      >
        {mission.order}
      </span>
      <span className="grid min-w-0 gap-1">
        <span className={cn('font-pixel text-lg leading-tight', locked && 'text-faint')}>
          {t(mission.title)}
        </span>
        <span className={cn('text-sm', locked ? 'text-faint' : 'text-muted-foreground')}>
          {locked && needs
            ? `${t(UI.needsFirst)} ${needs.order}. ${t(needs.title)}`
            : t(mission.objective)}
        </span>
        {result && (
          <span className="text-xs text-warn">
            {t(UI.bestScore)} {result.bestScore} {t(UI.points)}
            {result.hintsUsed === 0 && ` (${t(UI.noHints)})`}
          </span>
        )}
      </span>
      <span className="col-start-2 flex items-center gap-3 sm:col-start-auto">
        <Badge variant="outline" className={cn('gap-1', STATE_STYLE[state])}>
          {state === 'done' && <Check aria-hidden="true" />}
          {state === 'locked' && <Lock aria-hidden="true" />}
          {t(label)}
        </Badge>
        {!locked && (
          <span
            className="hidden size-8 items-center justify-center rounded-md bg-secondary text-foreground transition-colors group-hover:bg-(--zone) group-hover:text-deep sm:flex"
            aria-hidden="true"
          >
            {state === 'done' ? <RotateCcw className="size-4" /> : <Play className="size-4" />}
          </span>
        )}
      </span>
      {current && (
        <span
          className="absolute top-1/2 -left-14 hidden -translate-y-1/2 sm:block"
          aria-hidden="true"
        >
          <Penguin size={30} />
        </span>
      )}
    </>
  );

  const frame = cn(
    'group relative grid grid-cols-[2rem_1fr] items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-3 transition-colors sm:grid-cols-[2.5rem_1fr_auto]',
    locked
      ? 'border-dashed border-border bg-transparent'
      : 'border-border bg-card hover:border-(--zone) focus-visible:border-(--zone) focus-visible:ring-2 focus-visible:ring-(--zone) focus-visible:outline-none',
    current && 'border-(--zone) shadow-[0_0_0_1px_var(--zone),0_12px_32px_-16px_var(--zone)]',
  );

  if (locked) {
    return (
      <div className={frame} aria-disabled="true">
        {body}
      </div>
    );
  }
  return (
    <Link
      className={frame}
      href={`/linux/${mission.id}`}
      aria-label={`${mission.order}. ${t(mission.title)}: ${t(state === 'done' ? UI.replayMission : UI.playMission)}`}
    >
      {body}
    </Link>
  );
}

/** Zones and missions with locked, open and done states (PRD section 8). */
export function MissionMap() {
  const t = useText();
  const progress = useProgress((s) => s.progress.linux);
  const zones = missionMap(missions, progress);
  const done = progress ? Object.keys(progress.missions).length : 0;

  useEffect(() => {
    void getProgressStore()
      .getState()
      .loadProgress('linux')
      .catch(() => {});
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-16 sm:px-6">
      <Link
        href="/linux"
        className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t(UI.backToTitle)}
      </Link>

      <header className="mt-6 mb-10 flex flex-wrap items-end justify-between gap-6">
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

      <ol>
        {zones.map(({ zone, missions: entries }) => (
          <li
            key={zone.id}
            className="relative border-l-2 border-[color-mix(in_srgb,var(--zone)_45%,var(--line))] pb-8 pl-6 last:pb-0 sm:pl-16"
            style={{ '--zone': zone.color } as CSSProperties}
          >
            <span
              className="absolute top-1.5 -left-[7px] size-3 rounded-[3px] bg-(--zone)"
              aria-hidden="true"
            />
            <h2 className="mb-3 font-pixel text-lg text-(--zone)">{t(zone.title)}</h2>
            {entries.length ? (
              <ol className="grid gap-2">
                {entries.map((entry) => (
                  <li key={entry.mission.id}>
                    <MissionCard entry={entry} />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-faint">{t(UI.zoneComing)}</p>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
