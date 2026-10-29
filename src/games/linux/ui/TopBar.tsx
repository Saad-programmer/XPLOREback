'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import logo from '@/public/brand/xplore-labs-logo.svg';
import { useProgress } from '@/src/shared/progress';
import { SaveIndicator } from '@/src/shared/ui/SaveIndicator';
import { needsPassword } from '../game-store';
import { UI } from '../strings';
import { useGame, useGameStore, useText } from './game-context';
import { ConfirmDialog } from './ConfirmDialog';
import { Icon } from './Icon';
import { PasswordBox } from './PasswordBox';
import { SettingsMenu } from './SettingsMenu';
import styles from './TopBar.module.css';

export function TopBar() {
  const t = useText();
  const store = useGameStore();
  const mission = useGame((s) => s.mission);
  const phase = useGame((s) => s.phase);
  const hintsUsed = useGame((s) => s.hintsUsed);
  const player = useProgress((s) => s.player);
  const muted = useProgress((s) => s.settings.muted);
  const maximized = useProgress((s) => s.settings.maximized);
  const updateSettings = useProgress((s) => s.updateSettings);
  const [fullscreen, setFullscreen] = useState(false);
  const goalId = useId();
  const playing = phase === 'playing';

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const [confirmRestart, setConfirmRestart] = useState(false);
  const restart = () => {
    setConfirmRestart(false);
    void store.getState().start({ fresh: true });
  };

  return (
    <header className={styles.bar}>
      <div className={styles.row}>
        {/* One level up: the game's title screen (progress is already saved). */}
        <Link
          className={styles.back}
          href="/linux"
          aria-label={t(UI.backToTitleScreen)}
          title={t(UI.backToTitleScreen)}
        >
          <Icon name="back" label="" />
          <Image src={logo} alt="" className={styles.logo} />
        </Link>
        <h1 className={styles.mission}>
          <span className={styles.order}>{mission.order}.</span> {t(mission.title)}
        </h1>
        <div className={styles.player}>
          {player && (
            <>
              <span className={styles.avatar} aria-hidden="true">
                {player.name.slice(0, 1)}
              </span>
              <span className={styles.playerName}>{player.name}</span>
              <span className={styles.points}>
                {player.points} {t(UI.points)}
              </span>
            </>
          )}
        </div>
        <nav className={styles.tools} aria-label="Game">
          <button type="button" className={styles.goalButton} popoverTarget={goalId}>
            <Icon name="goal" label="" />
            {t(UI.goal)}
          </button>
          <div id={goalId} popover="auto" className={styles.goalPanel}>
            <p className={styles.goalLabel}>{t(UI.goal)}</p>
            <p className={styles.goalText}>{t(mission.objective)}</p>
          </div>
          <button
            type="button"
            className={styles.hint}
            onClick={() => store.getState().showHint()}
            disabled={!playing}
          >
            {hintsUsed >= mission.hints.length ? t(UI.showAnswer) : t(UI.hint)}
            <span className={styles.count}>
              {hintsUsed}/{mission.hints.length}
            </span>
          </button>
          <button
            type="button"
            className={styles.icon}
            onClick={() => updateSettings({ muted: !muted })}
            aria-pressed={!muted}
            title={t(muted ? UI.soundOff : UI.soundOn)}
          >
            <Icon
              name={muted ? 'sound-off' : 'sound-on'}
              label={t(muted ? UI.soundOff : UI.soundOn)}
            />
          </button>
          <SettingsMenu buttonClass={styles.icon} />
          <button
            type="button"
            className={styles.icon}
            onClick={() => setConfirmRestart(true)}
            title={t(UI.restart)}
          >
            <Icon name="restart" label={t(UI.restart)} />
          </button>
          <button
            type="button"
            className={styles.icon}
            onClick={toggleFullscreen}
            aria-pressed={fullscreen}
            title={t(UI.fullscreen)}
          >
            <Icon name="fullscreen" label={t(UI.fullscreen)} />
          </button>
          <button
            type="button"
            className={styles.icon}
            onClick={() => updateSettings({ maximized: !maximized })}
            aria-pressed={maximized}
            title={t(maximized ? UI.restore : UI.maximize)}
          >
            <Icon
              name={maximized ? 'restore' : 'maximize'}
              label={t(maximized ? UI.restore : UI.maximize)}
            />
          </button>
        </nav>
      </div>
      <div className={`${styles.row} ${styles.end}`}>
        {needsPassword(mission) && <PasswordBox />}
        <SaveIndicator />
      </div>
      {confirmRestart && (
        <ConfirmDialog
          message={t(UI.restartConfirm)}
          confirmLabel={t(UI.startAgain)}
          cancelLabel={t(UI.cancel)}
          onConfirm={restart}
          onCancel={() => setConfirmRestart(false)}
        />
      )}
    </header>
  );
}
