'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { getProgressStore, useProgress } from '@/src/shared/progress';
import { missions } from '../content';
import { GAME_TITLE } from '../meta';
import { UI } from '../strings';
import { requestFreshStart, titleMenu } from '../title';
import { Galaxy } from './Galaxy';
import { useReducedMotion, useText } from './game-context';
import { Penguin } from './Penguin';
import { SettingsMenu } from './SettingsMenu';
import styles from './TitleScreen.module.css';

const TYPE_MS = 95;

type Stage = 'boot' | 'press' | 'menu';

/** The title types itself in like a terminal command, then settles (PRD section 8). */
function Logo({ onBooted, instant }: { onBooted: () => void; instant: boolean }) {
  const [shown, setShown] = useState(instant ? GAME_TITLE.length : 0);
  const done = shown >= GAME_TITLE.length;

  useEffect(() => {
    if (done) {
      const settle = setTimeout(onBooted, instant ? 0 : 650);
      return () => clearTimeout(settle);
    }
    const timer = setInterval(() => setShown((n) => n + 1), TYPE_MS);
    return () => clearInterval(timer);
  }, [done, instant, onBooted]);

  return (
    <div className={styles.logo} data-done={done || undefined}>
      <div className={styles.mascot} aria-hidden="true">
        <Penguin mood="happy" size={112} />
        <svg className={styles.keyboard} width="64" height="16" viewBox="0 0 64 16">
          <rect
            x="0"
            y="0"
            width="64"
            height="16"
            rx="3"
            fill="var(--storm)"
            stroke="var(--line)"
          />
          {[0, 1, 2, 3, 4, 5, 6].map((key) => (
            <rect
              key={key}
              className={styles.key}
              x={4 + key * 8.4}
              y="4"
              width="6"
              height="8"
              rx="1.5"
            />
          ))}
        </svg>
      </div>
      <h1 className={styles.title} aria-label={GAME_TITLE}>
        <span aria-hidden="true">
          {GAME_TITLE.slice(0, shown)}
          <span className={styles.cursor}>_</span>
        </span>
      </h1>
    </div>
  );
}

export function TitleScreen() {
  const t = useText();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const progress = useProgress((s) => s.progress.linux);
  const [stage, setStage] = useState<Stage>('boot');
  const [leaving, setLeaving] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const menu = titleMenu(missions, progress);

  useEffect(() => {
    void getProgressStore()
      .getState()
      .loadProgress('linux')
      .catch(() => {});
  }, []);

  // Enter (or a click) skips the boot and opens the menu.
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
    if (stage === 'menu') menuRef.current?.querySelector<HTMLElement>('button, a')?.focus();
  }, [stage]);

  const play = (missionId: string) => {
    setLeaving(true); // stops the galaxy before the game screen loads
    router.push(`/linux/${missionId}`);
  };

  const newGame = () => {
    const first = missions[0];
    if (menu.hasProgress && !window.confirm(t(UI.newGameConfirm))) return;
    requestFreshStart(first.id);
    play(first.id);
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

  return (
    <main className={styles.screen}>
      <Galaxy paused={leaving} reducedMotion={reducedMotion} />
      <div className={styles.content}>
        <Logo
          instant={reducedMotion}
          onBooted={() => setStage((s) => (s === 'boot' ? 'press' : s))}
        />

        {stage === 'press' && <p className={styles.press}>{t(UI.pressStart)}</p>}

        {stage === 'menu' && (
          <nav aria-label={t(UI.titleMenu)}>
            <ul className={styles.menu} ref={menuRef} onKeyDown={onMenuKey}>
              {menu.hasProgress && (
                <li>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() => play(menu.continueTo.id)}
                  >
                    {t(UI.continue)}
                    <span className={styles.detail}>
                      {menu.finished
                        ? t(UI.allDone)
                        : `${t(UI.missionLabel)} ${menu.continueTo.order}: ${t(menu.continueTo.title)}`}
                    </span>
                  </button>
                </li>
              )}
              <li>
                <button type="button" className={styles.item} onClick={newGame}>
                  {menu.hasProgress ? t(UI.newGame) : t(UI.start)}
                </button>
              </li>
              <li>
                <Link className={styles.item} href="/linux/missions">
                  {t(UI.missions)}
                </Link>
              </li>
              <li>
                <SettingsMenu buttonClass={styles.item} menuClass={styles.settings} textButton />
              </li>
              <li>
                {/* Xplore is another app on the same domain (Multi-Zones): a plain link. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a className={styles.item} href="/">
                  {t(UI.backToXplore)}
                </a>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </main>
  );
}
