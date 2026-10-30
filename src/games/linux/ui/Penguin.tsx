import Image, { type StaticImageData } from 'next/image';
import disappointed from '@/public/games/linux/characters/pixel/face-disappointed.webp';
import happy from '@/public/games/linux/characters/pixel/face-happy.webp';
import laughing from '@/public/games/linux/characters/pixel/face-laughing.webp';
import neutral from '@/public/games/linux/characters/pixel/face-neutral.webp';
import proud from '@/public/games/linux/characters/pixel/face-proud.webp';
import shocked from '@/public/games/linux/characters/pixel/face-shocked.webp';
import sleeping from '@/public/games/linux/characters/pixel/face-sleeping.webp';
import thinking from '@/public/games/linux/characters/pixel/face-thinking.webp';
import type { Mood } from '../content/schema';
import styles from './Penguin.module.css';

/** One face per mood, cut from the art by scripts/cut-mascot.mjs. */
export const PENGUIN_FACES: Record<Mood, StaticImageData> = {
  neutral,
  happy,
  thinking,
  shocked,
  proud,
  disappointed,
  laughing,
  sleeping,
};

/**
 * Pixel, the guide (PRD section 6). The files are small (about 15 KB) and served
 * as they are, so a mood change shows a face the browser already has.
 */
export function Penguin({ mood = 'neutral', size = 64 }: { mood?: Mood; size?: number }) {
  return (
    <Image
      src={PENGUIN_FACES[mood]}
      alt=""
      width={size}
      height={size}
      unoptimized
      draggable={false}
      className={styles.face}
    />
  );
}

/** The same face inside an SVG drawing (the live map): HTML images do not render there. */
export function PenguinInSvg({ mood = 'neutral', size = 28 }: { mood?: Mood; size?: number }) {
  return <image href={PENGUIN_FACES[mood].src} width={size} height={size} aria-hidden="true" />;
}

/** Loads every face once, so the first mood change does not flash. */
export function preloadPenguinFaces() {
  for (const face of Object.values(PENGUIN_FACES)) {
    const image = new window.Image();
    image.src = face.src;
  }
}
