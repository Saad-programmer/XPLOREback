'use client';

import { ArrowLeft, ChevronDown, Globe, ListChecks, MapIcon, Play, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { GameId } from '../bridge/types';
import { Badge as PixelBadge } from '../components/ui/8bit/badge';
import { Button as PixelButton } from '../components/ui/8bit/button';
import { Progress as PixelProgress } from '../components/ui/8bit/progress';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { GAMES } from '../games';
import { GameThumb } from '../hub/GameThumb';
import { useText } from '../i18n/use-text';
import { getProgressStore, useProgress } from '../progress';
import { useReducedMotion } from '../ui/use-reduced-motion';
import { GAME_COVERS } from './covers';
import { DETAILS } from './strings';

interface GameDetailsProps {
  gameId: GameId;
  /** Number of missions in the content files, null for games not built yet. */
  missionCount: number | null;
  /** "More info" Markdown, already rendered on the server, per language. */
  about: { en: ReactNode; fr: ReactNode } | null | undefined;
}

export function GameDetails({ gameId, missionCount, about }: GameDetailsProps) {
  const t = useText();
  const game = GAMES.find((entry) => entry.id === gameId)!;
  const cover = GAME_COVERS[game.id];
  const playable = game.status === 'play' && game.href !== null;
  const language = useProgress((s) => s.settings.language);
  const progress = useProgress((s) => s.progress[game.id]);
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const aboutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playable) return;
    void getProgressStore()
      .getState()
      .loadProgress(game.id)
      .catch(() => {});
  }, [game.id, playable]);

  const done = progress ? Object.keys(progress.missions).length : 0;
  const started = done > 0 || Boolean(progress?.currentMissionId);

  const toggle = (next: boolean) => {
    setOpen(next);
    // Bring the text into view: it opens below the fold on most screens.
    if (next)
      requestAnimationFrame(() =>
        aboutRef.current?.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start',
        }),
      );
  };

  return (
    <Collapsible open={open} onOpenChange={toggle} asChild>
      <main
        className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 sm:px-6"
        style={{ '--accent': game.accent } as CSSProperties}
      >
        <Link
          href="/games"
          className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t(DETAILS.allGames)}
        </Link>

        <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
          <div className="hub-card relative overflow-hidden rounded-2xl border border-border bg-deep shadow-[0_24px_70px_-28px_var(--accent)]">
            {cover ? (
              <Image
                src={cover}
                alt={t(game.title)}
                priority
                placeholder="blur"
                sizes="(min-width: 1152px) 640px, (min-width: 1024px) 56vw, 100vw"
                className="h-auto w-full"
              />
            ) : (
              <div className="opacity-80 saturate-50">
                <GameThumb id={game.id} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-(--accent) text-(--accent)">
                {t(game.subject)}
              </Badge>
              {!playable && (
                <PixelBadge font="retro" className="bg-secondary text-muted-foreground">
                  {t(DETAILS.comingSoon)}
                </PixelBadge>
              )}
            </div>

            <h1 className="font-pixel text-4xl leading-none font-semibold text-[#f2ecff] sm:text-5xl">
              {t(game.title)}
            </h1>
            <p className="leading-relaxed text-muted-foreground">{t(game.blurb)}</p>

            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {missionCount !== null && (
                <li className="flex items-center gap-2">
                  <ListChecks className="size-4 text-(--accent)" aria-hidden="true" />
                  {missionCount} {t(DETAILS.missions)}
                </li>
              )}
              {game.guide.name !== '?' && (
                <li className="flex items-center gap-2">
                  <UserRound className="size-4 text-(--accent)" aria-hidden="true" />
                  {t(DETAILS.guide)}: {game.guide.name}
                </li>
              )}
              <li className="flex items-center gap-2">
                <Globe className="size-4 text-(--accent)" aria-hidden="true" />
                {t(DETAILS.inBrowser)}
              </li>
            </ul>

            {playable && missionCount !== null && (
              <div className="rounded-lg border border-border bg-card/60 p-4">
                <div className="mb-3 flex items-baseline justify-between text-sm">
                  <span className="text-foreground">{t(DETAILS.progress)}</span>
                  <span className="font-pixel text-warn">
                    {done}/{missionCount} {t(DETAILS.done)}
                  </span>
                </div>
                <PixelProgress
                  value={missionCount ? (done / missionCount) * 100 : 0}
                  variant="retro"
                  font="normal"
                  progressBg="bg-ok"
                  className="h-3"
                  aria-label={`${t(DETAILS.progress)}: ${done}/${missionCount}`}
                />
              </div>
            )}

            {!playable && <p className="text-sm text-warn">{t(DETAILS.notYet)}</p>}

            <div className="flex flex-wrap items-center gap-4 pt-1">
              {playable ? (
                <PixelButton
                  asChild
                  size="lg"
                  font="retro"
                  className="bg-ok text-deep hover:bg-ok/90"
                >
                  <Link href={game.href!}>
                    <Play className="size-4 fill-current" aria-hidden="true" />
                    {t(started ? DETAILS.continue : DETAILS.playNow)}
                  </Link>
                </PixelButton>
              ) : (
                <PixelButton size="lg" font="retro" disabled>
                  {t(DETAILS.comingSoon)}
                </PixelButton>
              )}
              {about && (
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="lg" className="border-border bg-transparent">
                    {t(open ? DETAILS.lessInfo : DETAILS.moreInfo)}
                    <ChevronDown
                      className={`size-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </Button>
                </CollapsibleTrigger>
              )}
              {playable && game.mapHref && (
                <Button variant="ghost" size="lg" asChild>
                  <Link href={game.mapHref}>
                    <MapIcon aria-hidden="true" />
                    {t(DETAILS.missionMap)}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {about && (
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div ref={aboutRef} className="scroll-mt-24 pt-12">
              <Card className="gap-0 border-border bg-card/70 px-6 py-8 sm:px-10">
                <h2 className="sr-only">{t(DETAILS.aboutTitle)}</h2>
                {language === 'fr' ? about.fr : about.en}
              </Card>
            </div>
          </CollapsibleContent>
        )}
      </main>
    </Collapsible>
  );
}

/** Shown while the page reads its route parameters. */
export function GameDetailsSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 sm:px-6" aria-busy="true">
      <div className="h-5 w-28 animate-pulse rounded bg-secondary" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12">
        <div className="aspect-[16/9] animate-pulse rounded-2xl bg-secondary" />
        <div className="flex flex-col gap-4">
          <div className="h-6 w-20 animate-pulse rounded bg-secondary" />
          <div className="h-12 w-3/4 animate-pulse rounded bg-secondary" />
          <div className="h-20 animate-pulse rounded bg-secondary" />
        </div>
      </div>
    </main>
  );
}
