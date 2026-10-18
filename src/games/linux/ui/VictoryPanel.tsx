'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { nextMission } from '../content';
import { UI } from '../strings';
import { useGame, useGameStore, useText } from './game-context';
import styles from './VictoryPanel.module.css';

export function VictoryPanel() {
  const t = useText();
  const store = useGameStore();
  const mission = useGame((s) => s.mission);
  const victory = useGame((s) => s.victory);
  const heading = useRef<HTMLHeadingElement>(null);
  const next = nextMission(mission.id);
  const outcome = victory?.outcome;

  useEffect(() => heading.current?.focus(), []);

  let reward = '…';
  if (outcome?.kind === 'queued') reward = t(UI.savedOffline);
  else if (outcome?.kind === 'done' && outcome.result.firstCompletion) {
    reward = `+${outcome.result.pointsAwarded} ${t(UI.pointsEarned)}`;
  } else if (outcome?.kind === 'done') reward = t(UI.alreadyDone);

  return (
    <div className={styles.overlay}>
      <section
        className={styles.panel}
        data-augmented-ui="tl-clip br-clip border"
        aria-labelledby="victory-title"
      >
        <h2 id="victory-title" className={styles.title} ref={heading} tabIndex={-1}>
          {t(UI.victoryTitle)}
        </h2>
        <p className={styles.reward} aria-live="polite">
          {reward}
        </p>
        <h3 className={styles.learnedLabel}>{t(UI.learned)}</h3>
        <p className={styles.concept}>{t(mission.concept)}</p>
        <div className={styles.actions}>
          {next ? (
            <Link
              className={styles.primary}
              href={`/linux/${next.id}`}
              data-augmented-ui="tr-clip bl-clip"
            >
              {t(UI.nextMission)}
            </Link>
          ) : (
            <p className={styles.done}>{t(UI.campaignDone)}</p>
          )}
          <Link className={styles.secondary} href="/linux/missions">
            {t(UI.missionMap)}
          </Link>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => void store.getState().start({ fresh: true })}
          >
            {t(UI.replay)}
          </button>
        </div>
      </section>
    </div>
  );
}
