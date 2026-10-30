'use client';

import { Lightbulb, Lock, Play, RotateCcw, Star, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useSyncExternalStore, type CSSProperties } from 'react';
import { Badge } from '@/src/shared/components/ui/badge';
import { Button } from '@/src/shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/shared/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/shared/components/ui/tabs';
import { cn } from '@/src/shared/lib/utils';
import { starsOf } from '../map-layout';
import { ZONES } from '../meta';
import type { MapMission } from '../mission-map';
import { UI } from '../strings';
import { useText } from './game-context';

const PHONE = '(max-width: 767px)';

/** Phones get the panel from the bottom, larger screens from the right. */
function usePhone() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(PHONE);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

export function Stars({ count, className }: { count: number; className?: string }) {
  const t = useText();
  return (
    <span className={cn('inline-flex gap-0.5', className)} aria-label={`${count}/3 ${t(UI.stars)}`}>
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn('size-3.5', n <= count ? 'fill-warn text-warn' : 'text-faint')}
        />
      ))}
    </span>
  );
}

function MissionTab({ entry }: { entry: MapMission }) {
  const t = useText();
  const { mission, state, result, needs } = entry;

  return (
    <div className="flex flex-col gap-5">
      <p className="leading-relaxed text-foreground">{t(mission.objective)}</p>

      {result && (
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: t(UI.stars), value: <Stars count={starsOf(result)} /> },
            { label: `${t(UI.bestScore)} (${t(UI.points)})`, value: result.bestScore },
            { label: t(UI.hintsUsed), value: result.hintsUsed },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-secondary/50 p-2">
              <dd className="flex h-6 items-center justify-center font-pixel text-lg text-foreground">
                {item.value}
              </dd>
              <dt className="mt-1 text-xs text-muted-foreground">{item.label}</dt>
            </div>
          ))}
        </dl>
      )}

      {state === 'locked' && needs && (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t(UI.needsFirst)} {needs.order}. {t(needs.title)}
        </p>
      )}

      {state !== 'done' && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {t(UI.recapLocked)}
        </p>
      )}

      {state === 'locked' ? (
        <Button size="lg" disabled>
          <Lock aria-hidden="true" />
          {t(UI.locked)}
        </Button>
      ) : (
        <Button asChild size="lg" className="bg-(--zone) font-pixel text-deep hover:bg-(--zone)/85">
          <Link href={`/linux/${mission.id}`}>
            {state === 'done' ? (
              <RotateCcw aria-hidden="true" />
            ) : (
              <Play className="fill-current" aria-hidden="true" />
            )}
            {t(state === 'done' ? UI.replayMission : UI.playMission)}
          </Link>
        </Button>
      )}
    </div>
  );
}

function RecapTab({ entry }: { entry: MapMission }) {
  const t = useText();
  const { mission, result } = entry;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-3 font-pixel text-base text-foreground">{t(UI.whatYouLearned)}</h3>
        <ul className="flex flex-col gap-3">
          {mission.recap.map((line, index) => (
            <li
              key={`${line.command}-${index}`}
              className="rounded-lg border border-border bg-secondary/40 p-3"
            >
              <code className="rounded bg-deep px-1.5 py-0.5 text-sm text-ok">{line.command}</code>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(line.text)}</p>
              {line.example && (
                <p className="mt-2 font-mono text-xs text-faint">
                  <span className="text-ok">$</span> {line.example}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex gap-3 rounded-lg border border-warn/40 bg-warn/10 p-3">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
        <div>
          <h3 className="text-xs font-semibold tracking-wide text-warn uppercase">
            {t(UI.keyIdea)}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{t(mission.concept)}</p>
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center justify-between gap-3 font-pixel text-base text-foreground">
          {t(UI.yourSolution)}
          {result && <Stars count={starsOf(result)} />}
        </h3>
        {result?.solution?.length ? (
          <ol className="rounded-lg border border-border bg-deep p-3 font-mono text-sm">
            {result.solution.map((command, index) => (
              <li key={index} className="flex gap-2 py-0.5 break-all text-foreground">
                <span className="text-ok select-none">intern@fst:$</span>
                {command}
              </li>
            ))}
          </ol>
        ) : (
          <p className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            <Terminal className="size-4 shrink-0" aria-hidden="true" />
            {t(UI.noSolutionYet)}
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * The side panel of a mission node: what to do and a Play button, and a recap
 * (commands learned + the player's own solution) unlocked once it is done.
 */
export function MissionPanel({
  entry,
  onClose,
}: {
  entry: MapMission | null;
  onClose: () => void;
}) {
  const t = useText();
  const phone = usePhone();
  const zone = entry && ZONES.find((z) => z.id === entry.mission.zone)!;
  const done = entry?.state === 'done';

  return (
    <Sheet open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={phone ? 'bottom' : 'right'}
        className={cn(
          'gap-0 overflow-y-auto border-border bg-card',
          phone ? 'max-h-[85dvh] rounded-t-2xl' : 'w-full sm:max-w-md',
        )}
        style={zone ? ({ '--zone': zone.color } as CSSProperties) : undefined}
      >
        {entry && zone && (
          <>
            <SheetHeader className="gap-2 border-b border-border pr-12">
              <Badge variant="outline" className="border-(--zone)/60 text-(--zone)">
                {t(zone.title)}
              </Badge>
              <SheetTitle className="font-pixel text-2xl leading-tight">
                <span className="text-(--zone)">{entry.mission.order}.</span>{' '}
                {t(entry.mission.title)}
              </SheetTitle>
              <SheetDescription className="sr-only">{t(entry.mission.objective)}</SheetDescription>
            </SheetHeader>

            {/* Keyed by mission: each node opens on its Mission tab. */}
            <Tabs key={entry.mission.id} defaultValue="mission" className="gap-4 p-4">
              <TabsList className="w-full">
                <TabsTrigger value="mission">{t(UI.missionTab)}</TabsTrigger>
                <TabsTrigger value="recap" disabled={!done}>
                  {!done && <Lock aria-hidden="true" />}
                  {t(UI.recapTab)}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="mission">
                <MissionTab entry={entry} />
              </TabsContent>
              {done && (
                <TabsContent value="recap">
                  <RecapTab entry={entry} />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
