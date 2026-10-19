'use client';

import { useEffect, useRef, useState } from 'react';
import { useText } from '../i18n/use-text';
import { getProgressStore } from '../progress';
import { INTRO_VIDEO, markIntroSeen } from './intro';
import styles from './IntroVideo.module.css';
import { HUB } from './strings';

/**
 * The Labs intro: plays at once, full screen, with a Skip button (and Esc),
 * then fades into the hub. The hub is already rendered underneath.
 *
 * Browsers block video with sound until the visitor has interacted with the
 * site, so it tries the version with sound and falls back to the silent one.
 */
export function IntroVideo({ onDone }: { onDone: () => void }) {
  const t = useText();
  const [leaving, setLeaving] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    // play() rejects with AbortError when our own cleanup pauses the video
    // (navigation, or React's double mount in development): not a real failure.
    let active = true;
    const finish = () => {
      markIntroSeen();
      setLeaving(true);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && finish();
    window.addEventListener('keydown', onKey);
    element.addEventListener('ended', finish);

    const playSilent = () => {
      element.src = INTRO_VIDEO.silent;
      element.muted = true;
      // Even muted autoplay can fail (power saving): show the hub instead.
      return element.play().catch((error: Error) => {
        if (!active || error.name === 'AbortError') return;
        console.info('[labs] intro not played:', error.name);
        onDone();
      });
    };
    const soundAllowed = !getProgressStore().getState().settings.muted;
    if (soundAllowed) {
      element.src = INTRO_VIDEO.sound;
      element.muted = false;
      void element.play().catch((error: Error) => {
        if (active && error.name !== 'AbortError') void playSilent();
      });
    } else {
      void playSilent();
    }

    return () => {
      active = false;
      window.removeEventListener('keydown', onKey);
      element.removeEventListener('ended', finish);
      element.pause();
    };
  }, [onDone]);

  // Close after the 600 ms fade. A timer, not animationend: that event never
  // fires when animations are off or the window is not drawing.
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onDone, 600);
    return () => clearTimeout(timer);
  }, [leaving, onDone]);

  return (
    <div
      className={styles.intro}
      data-leaving={leaving || undefined}
      role="dialog"
      aria-modal="true"
      aria-label={t(HUB.introLabel)}
    >
      <video ref={video} className={styles.video} playsInline preload="auto" />
      {!leaving && (
        <button
          type="button"
          className={styles.skip}
          onClick={() => {
            markIntroSeen();
            setLeaving(true);
          }}
        >
          {t(HUB.skip)}
        </button>
      )}
    </div>
  );
}
