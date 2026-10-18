'use client';

import { useEffect, useRef, useState } from 'react';
import { useText } from '../i18n/use-text';
import { useProgress } from '../progress';
import { INTRO_VIDEO, markIntroSeen } from './intro';
import styles from './IntroVideo.module.css';
import { HUB } from './strings';

type Stage = 'start' | 'playing' | 'leaving';

/**
 * The Labs intro (PRD section 8): a start screen on the first frame, a click
 * that unlocks sound, the video full screen, Skip or Esc, then a fade into the
 * hub. The hub is already rendered underneath and the video only loads now.
 */
export function IntroVideo({ onDone }: { onDone: () => void }) {
  const t = useText();
  const muted = useProgress((s) => s.settings.muted);
  const updateSettings = useProgress((s) => s.updateSettings);
  const [stage, setStage] = useState<Stage>('start');
  const video = useRef<HTMLVideoElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const src = muted ? INTRO_VIDEO.silent : INTRO_VIDEO.sound;

  const finish = () => {
    markIntroSeen();
    setStage('leaving');
  };

  useEffect(() => startButton.current?.focus(), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const start = () => {
    const element = video.current;
    if (!element) return finish();
    setStage('playing');
    element.muted = muted;
    element.currentTime = 0;
    // The click is the user gesture that lets the browser play sound.
    void element.play().catch(finish);
  };

  return (
    <div
      className={styles.intro}
      data-stage={stage}
      role="dialog"
      aria-modal="true"
      aria-label={t(HUB.introLabel)}
      onAnimationEnd={(event) =>
        event.target === event.currentTarget && stage === 'leaving' && onDone()
      }
    >
      <video
        key={src}
        ref={video}
        className={styles.video}
        // The video starts on black, so the poster is the logo frame at 4 s.
        // It loads only when this start screen shows.
        src={`${src}#t=4`}
        preload="auto"
        playsInline
        onEnded={finish}
        onError={() => {
          // The hub appears at once if the video cannot load.
          setStage('leaving');
          onDone();
        }}
      />
      {stage === 'start' && (
        <div className={styles.start}>
          <button ref={startButton} type="button" className={styles.startButton} onClick={start}>
            {t(HUB.introStart)}
          </button>
          <button
            type="button"
            className={styles.sound}
            aria-pressed={!muted}
            onClick={() => updateSettings({ muted: !muted })}
          >
            {t(muted ? HUB.soundOff : HUB.soundOn)}
          </button>
        </div>
      )}
      {stage !== 'leaving' && (
        <button type="button" className={styles.skip} onClick={finish}>
          {t(HUB.skip)}
        </button>
      )}
    </div>
  );
}
