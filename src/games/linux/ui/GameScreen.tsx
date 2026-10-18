'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type CSSProperties } from 'react';
import { getProgressStore, useProgress } from '@/src/shared/progress';
import { getMission, memes, reactions } from '../content';
import { createGameStore } from '../game-store';
import { ZONES } from '../meta';
import { UI } from '../strings';
import { DialogueBox } from './DialogueBox';
import { Effects } from './Effects';
import { GameContext, useGame, useGameStore, useText } from './game-context';
import styles from './GameScreen.module.css';
import { LiveMap } from './LiveMap';
import { linuxSound } from './sound';
import { TopBar } from './TopBar';
import { VictoryPanel } from './VictoryPanel';
import { VimTrap } from './VimTrap';

// xterm.js needs the browser.
const Terminal = dynamic(() => import('./Terminal'), { ssr: false });

export function GameScreen({ missionId }: { missionId: string }) {
  const [store] = useState(() =>
    createGameStore({
      mission: getMission(missionId)!,
      progress: getProgressStore(),
      reactions,
      memes,
      sound: linuxSound,
    }),
  );

  useEffect(() => {
    void store.getState().start();
    // Send the latest checkpoint when the player leaves or hides the page.
    const flush = () => void getProgressStore().getState().flushCheckpoints();
    const onVisibility = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      store.getState().dispose();
    };
  }, [store]);

  return (
    <GameContext.Provider value={store}>
      <Screen />
    </GameContext.Provider>
  );
}

function Screen() {
  const t = useText();
  const mission = useGame((s) => s.mission);
  const phase = useGame((s) => s.phase);
  const sessionId = useGame((s) => s.sessionId);
  const vimOpen = useGame((s) => s.vimOpen);
  const store = useGameStore();
  const language = useProgress((s) => s.settings.language);
  const maximized = useProgress((s) => s.settings.maximized);
  const reducedMotion = useProgress((s) => s.settings.reducedMotion);
  const updateSettings = useProgress((s) => s.updateSettings);
  const zone = ZONES.find((z) => z.id === mission.zone)!;

  // help and man follow the player's language.
  useEffect(() => store.getState().getShell()?.setLang(language), [store, language, sessionId]);

  // Back to the terminal after escaping vim.
  useEffect(() => {
    if (!vimOpen) document.querySelector<HTMLElement>('.xterm-helper-textarea')?.focus();
  }, [vimOpen]);

  useEffect(() => {
    if (!maximized) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') updateSettings({ maximized: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [maximized, updateSettings]);

  return (
    <div
      className={styles.page}
      data-maximized={maximized || undefined}
      data-reduced-motion={reducedMotion || undefined}
      style={{ '--zone': zone.color } as CSSProperties}
    >
      <section
        id="game-frame"
        className={styles.frame}
        data-augmented-ui="tl-clip br-clip border"
        aria-label={t(mission.title)}
      >
        <TopBar />
        <div className={styles.stage}>
          {phase === 'loading' && <p className={styles.status}>{t(UI.loading)}</p>}
          {phase === 'error' && (
            <p className={styles.status} role="alert">
              {t(UI.loadError)}
            </p>
          )}
          {(phase === 'playing' || phase === 'won') && (
            <>
              <div className={styles.terminal}>
                <Terminal key={sessionId} />
                {vimOpen && <VimTrap />}
              </div>
              <LiveMap />
              {phase === 'won' && <VictoryPanel />}
            </>
          )}
          <Effects />
        </div>
        <DialogueBox />
      </section>
    </div>
  );
}
