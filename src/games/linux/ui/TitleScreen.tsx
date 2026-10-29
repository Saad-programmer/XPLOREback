'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from 'react';
import { getProgressStore, useProgress } from '@/src/shared/progress';
import { GAME_COVERS } from '@/src/shared/site/covers';
import { Starfield } from '@/src/shared/site/Starfield';
import { missions } from '../content';
import { GAME_TITLE } from '../meta';
import { UI } from '../strings';
import { requestFreshStart, titleMenu } from '../title';
import { ConfirmDialog } from './ConfirmDialog';
import { useReducedMotion, useText } from './game-context';
import { SettingsMenu } from './SettingsMenu';
import styles from './TitleScreen.module.css';

type Stage = 'press' | 'menu';

const cover = GAME_COVERS.linux!;

/**
 * The capsule art as a living title screen: a slow zoom, a little parallax
 * with the mouse and twinkling stars on top. The art already shows the game
 * logo and the mascot, so the screen adds only the menu.
 */
function Backdrop({ paused, reducedMotion }: { paused: boolean; reducedMotion: boolean }) {
  const art = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = art.current;
    if (!element || reducedMotion) return;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    const follow = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      element.style.setProperty('--px', `${current.x.toFixed(2)}px`);
      element.style.setProperty('--py', `${current.y.toFixed(2)}px`);
      const settled = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) < 0.05;
      frame = settled ? 0 : requestAnimationFrame(follow);
    };
    const onMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * -18;
      target.y = (event.clientY / window.innerHeight - 0.5) * -12;
      frame ||= requestAnimationFrame(follow);
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  return (
    <div className={styles.backdrop} data-paused={paused || undefined} aria-hidden="true">
      {/* Fills the sides on screens taller than the art (phones). */}
      <Image src={cover} alt="" fill sizes="100vw" loading="eager" className={styles.fill} />
      <div ref={art} className={styles.art}>
        <Image
          src={cover}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          quality={90}
          className={styles.artImage}
        />
      </div>
      <Starfield sky={false} paused={paused} />
      <div className={styles.scrim} />
    </div>
  );
}

export function TitleScreen() {
  const t = useText();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const progress = useProgress((s) => s.progress.linux);
  const [stage, setStage] = useState<Stage>('press');
  // The menu waits for progress: otherwise it shows "Start", then rebuilds as
  // "Continue / New game" and every item moves under the player's mouse.
  const [ready, setReady] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const [navigating, startNavigation] = useTransition();
  const menuRef = useRef<HTMLUListElement>(null);
  const menu = titleMenu(missions, progress);
  const showMenu = stage === 'menu' && ready;

  useEffect(() => {
    void getProgressStore()
      .getState()
      .loadProgress('linux')
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Enter (or a click) opens the menu.
  useEffect(() => {
    if (stage === 'menu') return;
    const open = (event: globalThis.KeyboardEvent | MouseEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      setStage('menu');
    };
    window.addEventListener('keydown', open);
    window.addEventListener('click', open);
    return () => {
      window.removeEventListener('keydown', open);
      window.removeEventListener('click', open);
    };
  }, [stage]);

  useEffect(() => {
    if (!showMenu) return;
    menuRef.current?.querySelector<HTMLElement>('button, a')?.focus();
    // Fetch the likely next screens now, so the click feels instant.
    router.prefetch(`/linux/${menu.continueTo.id}`);
    router.prefetch(`/linux/${missions[0].id}`);
  }, [showMenu, menu.continueTo.id, router]);

  const play = (missionId: string, item: string) => {
    setTarget(item);
    startNavigation(() => router.push(`/linux/${missionId}`));
  };

  const startNewGame = () => {
    setConfirming(false);
    requestFreshStart(missions[0].id);
    play(missions[0].id, 'new');
  };

  /** Up and down arrows move between menu items, like a console menu. */
  const onMenuKey = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [
      ...(menuRef.current?.querySelectorAll<HTMLElement>(':scope > li > button, :scope > li > a') ??
        []),
    ];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };

  const loading = (item: string) =>
    navigating && target === item ? (
      <span className={styles.detail}>{t(UI.loadingShort)}</span>
    ) : null;

  return (
    <main className={styles.screen}>
      {/* Everything stops moving as soon as a mission starts loading. */}
      <Backdrop paused={navigating} reducedMotion={reducedMotion} />
      <div className={styles.content}>
        {/* The art shows the logo; the title is for screen readers. */}
        <h1 className="visually-hidden">{GAME_TITLE}</h1>

        {stage === 'press' && <p className={styles.press}>{t(UI.pressStart)}</p>}
        {stage === 'menu' && !ready && <p className={styles.press}>{t(UI.loadingShort)}</p>}

        {showMenu && (
          <nav aria-label={t(UI.titleMenu)} aria-busy={navigating || undefined}>
            <ul className={styles.menu} ref={menuRef} onKeyDown={onMenuKey}>
              {menu.hasProgress && (
                <li key="continue">
                  <button
                    type="button"
                    className={styles.item}
                    disabled={navigating}
                    onClick={() => play(menu.continueTo.id, 'continue')}
                  >
                    {t(UI.continue)}
                    {loading('continue') ?? (
                      <span className={styles.detail}>
                        {menu.finished
                          ? t(UI.allDone)
                          : `${t(UI.missionLabel)} ${menu.continueTo.order}: ${t(menu.continueTo.title)}`}
                      </span>
                    )}
                  </button>
                </li>
              )}
              <li key="new">
                <button
                  type="button"
                  className={styles.item}
                  disabled={navigating}
                  onClick={() => (menu.hasProgress ? setConfirming(true) : startNewGame())}
                >
                  {menu.hasProgress ? t(UI.newGame) : t(UI.start)}
                  {loading('new')}
                </button>
              </li>
              <li key="missions">
                <Link className={styles.item} href="/linux/missions">
                  {t(UI.missions)}
                </Link>
              </li>
              <li key="settings">
                <SettingsMenu buttonClass={styles.item} menuClass={styles.settings} textButton />
              </li>
              <li key="quit">
                {/* One level up: the game's details page. */}
                <Link className={styles.item} href="/games/linux">
                  {t(UI.quit)}
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
      {confirming && (
        <ConfirmDialog
          message={t(UI.newGameConfirm)}
          confirmLabel={t(UI.startAgain)}
          cancelLabel={t(UI.cancel)}
          onConfirm={startNewGame}
          onCancel={() => setConfirming(false)}
        />
      )}
    </main>
  );
}
