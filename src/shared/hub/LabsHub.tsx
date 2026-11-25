'use client';

import { Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { asset } from '../asset';
import { Badge } from '../components/ui/8bit/badge';
import { Button } from '../components/ui/button';
import { GAMES, type GameEntry } from '../games';
import { useText } from '../i18n/use-text';
import { GAME_COVERS } from '../site/covers';
import { useModalDialog } from '../ui/use-modal-dialog';
import { useReducedMotion } from '../ui/use-reduced-motion';
import { GameThumb } from './GameThumb';
import { introSeen } from './intro';
import { IntroVideo } from './IntroVideo';
import { HUB } from './strings';
import { WeeklyXpBadge } from './WeeklyXpBadge';

const noSubscription = () => () => {};

/** "Your game here": how to propose a game to the club. */
function ProposePanel({ onClose }: { onClose: () => void }) {
  const t = useText();
  const dialog = useModalDialog(onClose);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="propose-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-6 text-card-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
    >
      <h2 id="propose-title" className="font-pixel text-2xl text-foreground">
        {t(HUB.yourGame)}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(HUB.yourGameText)}</p>
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" autoFocus onClick={() => dialog.current?.close()}>
          {t(HUB.close)}
        </Button>
      </div>
    </dialog>
  );
}

/** A game card: the capsule art, and a terminal sneak peek on hover or focus. */
function GameCard({ game }: { game: GameEntry }) {
  const t = useText();
  const cover = GAME_COVERS[game.id];
  const playable = game.status === 'play';

  return (
    <Link
      href={`/games/${game.id}`}
      className="hub-card group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:border-(--accent) hover:shadow-[0_12px_40px_-12px_var(--accent)] focus-visible:border-(--accent) focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-none"
      style={{ '--accent': game.accent } as CSSProperties}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-deep">
        {cover ? (
          <>
            <Image
              src={cover}
              alt=""
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 370px, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
              <GameThumb id={game.id} overlay />
            </div>
          </>
        ) : game.id === 'network' ? (
          <iframe
            className="pointer-events-none absolute inset-0 h-full w-full border-0"
            src={asset('games/nextHop/index.html#shot=title:0')}
            title="Next Hop preview"
            loading="lazy"
            tabIndex={-1}
            aria-hidden="true"
          />
        ) : (
          <div className={playable ? '' : 'opacity-70 saturate-50'}>
            <GameThumb id={game.id} />
          </div>
        )}
      </div>
      <div className="flex flex-1 items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-pixel text-lg leading-tight text-foreground">
            {t(game.title)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t(game.subject)}</p>
        </div>
        <Badge
          font="retro"
          className={playable ? 'bg-ok text-deep' : 'bg-secondary text-muted-foreground'}
        >
          {t(playable ? HUB.playNow : HUB.comingSoon)}
        </Badge>
      </div>
    </Link>
  );
}

/** The Labs home: a grid of game cards, like game portals (PRD section 8). */
export function LabsHub() {
  const t = useText();
  const reducedMotion = useReducedMotion();
  const [proposing, setProposing] = useState(false);
  // "Seen" lives in localStorage: false on the server, so the hub renders first (PRD section 8).
  const firstVisit = useSyncExternalStore(
    noSubscription,
    () => !introSeen(),
    () => false,
  );
  const [introClosed, setIntroClosed] = useState(false);
  const closeIntro = useCallback(() => setIntroClosed(true), []);
  const closePropose = useCallback(() => setProposing(false), []);
  const intro = !introClosed && firstVisit && !reducedMotion;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-12 sm:px-6 sm:pt-14">
      {/* The games speak for themselves; the title is for screen readers. */}
      <h1 className="sr-only">{t(HUB.games)}</h1>

      <WeeklyXpBadge />

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <li key={game.id}>
            <GameCard game={game} />
          </li>
        ))}
        <li>
          <button
            type="button"
            className="flex h-full min-h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() => setProposing(true)}
          >
            <Plus className="size-8" aria-hidden="true" />
            <span className="font-pixel text-lg text-foreground">{t(HUB.yourGame)}</span>
            <span className="text-sm">{t(HUB.propose)}</span>
          </button>
        </li>
      </ul>

      {proposing && <ProposePanel onClose={closePropose} />}
      {intro && <IntroVideo onDone={closeIntro} />}
    </main>
  );
}
