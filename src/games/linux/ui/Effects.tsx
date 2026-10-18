'use client';

import { useEffect } from 'react';
import { asset } from '@/src/shared/asset';
import type { Effect } from '../game-store';
import { UI } from '../strings';
import { useGame, useGameStore, useReducedMotion, useText } from './game-context';
import styles from './Effects.module.css';

const frame = () => document.getElementById('game-frame');

/** Effects done with the Web Animations API on the whole game frame. */
function FrameAnimation({ effect }: { effect: Effect }) {
  const store = useGameStore();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const clear = () => store.getState().clearEffect(effect.id);
    const target = frame();
    if (!target || reducedMotion) return clear();
    const animation =
      effect.kind === 'shake'
        ? target.animate(
            [
              { transform: 'translateX(0)' },
              { transform: 'translateX(-6px)' },
              { transform: 'translateX(5px)' },
              { transform: 'translateX(-3px)' },
              { transform: 'translateX(0)' },
            ],
            { duration: 280, easing: 'ease-out' },
          )
        : // rm -rf /: the screen melts, then rewinds (PRD section 7).
          target.animate(
            [
              { filter: 'none', transform: 'none' },
              {
                filter: 'hue-rotate(-40deg) saturate(2) blur(1px)',
                transform: 'skewY(2deg) scaleY(1.04) translateY(18px)',
                offset: 0.45,
              },
              {
                filter: 'hue-rotate(-60deg) saturate(3) blur(3px)',
                transform: 'skewY(-3deg) scaleY(1.1) translateY(40px)',
                offset: 0.6,
              },
              { filter: 'none', transform: 'none' },
            ],
            { duration: 2600, easing: 'ease-in-out' },
          );
    animation.onfinish = clear;
    return () => animation.cancel();
  }, [effect, store, reducedMotion]);

  if (effect.kind !== 'melt') return null;
  return <div className={styles.melt} aria-hidden="true" />;
}

function Confetti({ effect }: { effect: Effect }) {
  const store = useGameStore();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    if (!reducedMotion) {
      void import('canvas-confetti').then(({ default: confetti }) => {
        if (cancelled) return;
        const colors = ['#7aa2f7', '#9ece6a', '#e0af68', '#bb9af7', '#f7768e'];
        void confetti({ particleCount: 90, spread: 70, origin: { x: 0.3, y: 0.7 }, colors });
        void confetti({ particleCount: 90, spread: 70, origin: { x: 0.7, y: 0.7 }, colors });
      });
    }
    store.getState().clearEffect(effect.id);
    return () => {
      cancelled = true;
    };
  }, [effect, store, reducedMotion]);
  return null;
}

/** A small train crosses the screen (sl). */
function Train({ effect }: { effect: Effect }) {
  const store = useGameStore();
  return (
    <div
      className={styles.train}
      aria-hidden="true"
      onAnimationEnd={() => store.getState().clearEffect(effect.id)}
    >
      <svg width="260" height="70" viewBox="0 0 260 70">
        <g fill="var(--storm)" stroke="var(--zone)" strokeWidth="2">
          <rect x="150" y="18" width="70" height="34" rx="4" />
          <rect x="196" y="4" width="22" height="16" />
          <path d="M220 52l30 0-8-18h-22z" />
          <rect x="70" y="24" width="70" height="28" rx="3" />
          <rect x="0" y="24" width="62" height="28" rx="3" />
        </g>
        <g fill="var(--zone)">
          {[20, 45, 90, 115, 165, 200].map((x) => (
            <circle key={x} cx={x} cy="58" r="8" />
          ))}
        </g>
        <g className={styles.smoke} fill="var(--muted)">
          <circle cx="205" cy="-2" r="6" />
          <circle cx="190" cy="-14" r="8" />
        </g>
      </svg>
    </div>
  );
}

function Combo({ effect }: { effect: Effect }) {
  const t = useText();
  const store = useGameStore();
  return (
    <div
      className={styles.combo}
      role="status"
      onAnimationEnd={() => store.getState().clearEffect(effect.id)}
    >
      {t(UI.combo)}!
    </div>
  );
}

/** A meme sticker pops next to the dialogue for a few seconds. */
function Sticker() {
  const store = useGameStore();
  const meme = useGame((s) => s.meme);
  if (!meme?.sticker) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny local SVG, no optimisation needed
    <img
      key={meme.id}
      className={styles.sticker}
      src={asset(`games/linux/${meme.sticker}`)}
      alt=""
      width={120}
      height={120}
      onAnimationEnd={() => store.getState().clearMeme(meme.id)}
    />
  );
}

export function Effects() {
  const effects = useGame((s) => s.effects);
  return (
    <>
      {effects.map((effect) => {
        switch (effect.kind) {
          case 'shake':
          case 'melt':
            return <FrameAnimation key={effect.id} effect={effect} />;
          case 'confetti':
            return <Confetti key={effect.id} effect={effect} />;
          case 'train':
            return <Train key={effect.id} effect={effect} />;
          case 'combo':
            return <Combo key={effect.id} effect={effect} />;
          default:
            return <Cleared key={effect.id} effect={effect} />;
        }
      })}
      <Sticker />
    </>
  );
}

/** Effects shown elsewhere (the vim screen follows `vimOpen`). */
function Cleared({ effect }: { effect: Effect }) {
  const store = useGameStore();
  useEffect(() => store.getState().clearEffect(effect.id), [effect, store]);
  return null;
}
