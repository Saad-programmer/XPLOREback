'use client';

import { ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';
import { asset } from '../asset';
import { useText } from '../i18n/use-text';
import { useReducedMotion } from '../ui/use-reduced-motion';
import { DETAILS, NETWORK_GAME } from './strings';
import styles from './NetworkGameDetails.module.css';

export function NetworkGameDetails() {
  const t = useText();
  const reducedMotion = useReducedMotion();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 sm:px-6">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t(DETAILS.allGames)}
      </Link>

      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:items-center lg:gap-12">
        <div>
          <span className={styles.badge}>{t(NETWORK_GAME.version)}</span>
          <h1 className="mt-5 font-pixel text-5xl leading-none font-semibold text-[#f2ecff] sm:text-6xl">
            {t(NETWORK_GAME.title)}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#7dcfff]">
            {t(NETWORK_GAME.tagline)}
          </p>
          <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
            {t(NETWORK_GAME.descriptionStart)}{' '}
            <strong className="font-semibold text-foreground">{t(NETWORK_GAME.packet)}</strong>{' '}
            {t(NETWORK_GAME.descriptionEnd)}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{t(NETWORK_GAME.developedBy)}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link className={styles.primaryButton} href="/nextHop">
              <Play className="size-4 fill-current" aria-hidden="true" />
              {t(NETWORK_GAME.playGame)}
            </Link>
          </div>

          <dl className={styles.stats}>
            {NETWORK_GAME.stats.map((stat) => (
              <div className={styles.stat} key={stat.value}>
                <dt>{t(stat.label)}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure
          className={styles.preview}
          aria-label={t(NETWORK_GAME.previewAlt)}
        >
          <iframe
            className={styles.previewFrame}
            src={asset(`games/nextHop/index.html${reducedMotion ? '#shot=title:0' : ''}`)}
            title={t(NETWORK_GAME.previewAlt)}
            loading="lazy"
            tabIndex={-1}
            aria-hidden="true"
          />
        </figure>
      </section>

    </main>
  );
}