'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { Penguin } from '@/src/games/linux/ui/Penguin';
import { GAMES, type GameEntry } from '../games';
import { useText } from '../i18n/use-text';
import { getProgressStore, useProgress } from '../progress';
import { useReducedMotion } from '../ui/use-reduced-motion';
import { GameThumb } from './GameThumb';
import { introSeen } from './intro';
import { IntroVideo } from './IntroVideo';
import styles from './LabsHub.module.css';
import { HUB } from './strings';

const noSubscription = () => () => {};

/** Intro panel shown before entering a game (PRD section 8). */
function GamePanel({ game, onClose }: { game: GameEntry | 'yours'; onClose: () => void }) {
  const t = useText();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const accent = game === 'yours' ? '#bb9af7' : game.accent;
  return (
    <dialog
      ref={dialog}
      className={styles.panel}
      style={{ '--accent': accent } as CSSProperties}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
      data-augmented-ui="tl-clip br-clip border"
    >
      {game === 'yours' ? (
        <>
          <h2 className={styles.panelTitle}>{t(HUB.yourGame)}</h2>
          <p className={styles.panelText}>{t(HUB.yourGameText)}</p>
        </>
      ) : (
        <>
          <div className={styles.panelHead}>
            {game.guide.kind === 'penguin' && (
              <div className={styles.portrait}>
                <Penguin mood="happy" size={72} />
              </div>
            )}
            <div>
              <span className={styles.tag}>{t(game.subject)}</span>
              <h2 className={styles.panelTitle}>{t(game.title)}</h2>
              {game.guide.kind === 'penguin' && (
                <p className={styles.guide}>
                  {t(HUB.guide)}: {game.guide.name}
                </p>
              )}
            </div>
          </div>
          <p className={styles.panelText}>{t(game.blurb)}</p>
          {game.status === 'soon' && <p className={styles.soonText}>{t(HUB.notYet)}</p>}
        </>
      )}
      <div className={styles.panelActions}>
        {game !== 'yours' && game.href && (
          <Link
            className={styles.playButton}
            href={game.href}
            data-augmented-ui="tr-clip bl-clip"
            autoFocus
          >
            {t(HUB.play)}
          </Link>
        )}
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => dialog.current?.close()}
        >
          {t(HUB.close)}
        </button>
      </div>
    </dialog>
  );
}

/** The Labs home: a grid of game cards, like game portals (PRD section 8). */
export function LabsHub() {
  const t = useText();
  const reducedMotion = useReducedMotion();
  const player = useProgress((s) => s.player);
  const [open, setOpen] = useState<GameEntry | 'yours' | null>(null);
  // "Seen" lives in localStorage: false on the server, so the hub renders first (PRD section 8).
  const firstVisit = useSyncExternalStore(
    noSubscription,
    () => !introSeen(),
    () => false,
  );
  const [introState, setIntroState] = useState<'auto' | 'replay' | 'closed'>('auto');
  const intro = introState === 'replay' || (introState === 'auto' && firstVisit && !reducedMotion);

  useEffect(() => {
    void getProgressStore()
      .getState()
      .init()
      .catch(() => {});
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t(HUB.title)}</h1>
          <p className={styles.tagline}>{t(HUB.tagline)}</p>
        </div>
        <div className={styles.side}>
          {player && (
            <span className={styles.player}>
              {player.name} <span className={styles.points}>{player.points}</span> {t(HUB.points)}
            </span>
          )}
          {/* Xplore is another app on the same domain (Multi-Zones): a plain link. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className={styles.back} href="/">
            {t(HUB.backToXplore)}
          </a>
        </div>
      </header>

      <main>
        <ul className={styles.grid}>
          {GAMES.map((game) => (
            <li key={game.id}>
              <button
                type="button"
                className={`hub-card ${styles.card}`}
                style={{ '--accent': game.accent } as CSSProperties}
                data-status={game.status}
                data-augmented-ui="tl-clip br-clip border"
                onClick={() => setOpen(game)}
              >
                <GameThumb id={game.id} />
                <span className={styles.cardBody}>
                  <span className={styles.cardTitle}>{t(game.title)}</span>
                  <span className={styles.meta}>
                    <span className={styles.tag}>{t(game.subject)}</span>
                    <span className={styles.badge} data-status={game.status}>
                      {t(game.status === 'play' ? HUB.playNow : HUB.comingSoon)}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={`hub-card ${styles.card} ${styles.yours}`}
              onClick={() => setOpen('yours')}
            >
              <span className={styles.plus} aria-hidden="true">
                +
              </span>
              <span className={styles.cardTitle}>{t(HUB.yourGame)}</span>
              <span className={styles.yoursText}>{t(HUB.propose)}</span>
            </button>
          </li>
        </ul>
      </main>

      <footer className={styles.footer}>
        <button type="button" className={styles.replay} onClick={() => setIntroState('replay')}>
          {t(HUB.replayIntro)}
        </button>
      </footer>

      {open && <GamePanel game={open} onClose={() => setOpen(null)} />}
      {intro && <IntroVideo onDone={() => setIntroState('closed')} />}
    </div>
  );
}
