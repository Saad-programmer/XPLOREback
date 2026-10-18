'use client';

import Link from 'next/link';
import { useEffect, type CSSProperties } from 'react';
import { getProgressStore, useProgress } from '@/src/shared/progress';
import { missions } from '../content';
import { GAME_TITLE } from '../meta';
import { missionMap, type MapMission } from '../mission-map';
import { UI } from '../strings';
import { useText } from './game-context';
import styles from './MissionMap.module.css';
import { Penguin } from './Penguin';

function MissionCard({ entry }: { entry: MapMission }) {
  const t = useText();
  const { mission, state, result, needs, current } = entry;
  const label = state === 'done' ? UI.done : state === 'open' ? UI.open : UI.locked;

  const body = (
    <>
      <span className={styles.order} aria-hidden="true">
        {mission.order}
      </span>
      <span className={styles.info}>
        <span className={styles.missionTitle}>{t(mission.title)}</span>
        <span className={styles.objective}>
          {state === 'locked' && needs
            ? `${t(UI.needsFirst)} ${needs.order}. ${t(needs.title)}`
            : t(mission.objective)}
        </span>
        {result && (
          <span className={styles.result}>
            {t(UI.bestScore)} {result.bestScore} {t(UI.points)}
            {result.hintsUsed === 0 && ` (${t(UI.noHints)})`}
          </span>
        )}
      </span>
      <span className={styles.state} data-state={state}>
        {state === 'locked' ? (
          <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
            <path
              d="M3 7V5a4 4 0 0 1 8 0v2M2 7h10v8H2z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        ) : null}
        {t(label)}
      </span>
      {current && (
        <span className={styles.here} aria-hidden="true">
          <Penguin size={30} />
        </span>
      )}
    </>
  );

  if (state === 'locked') {
    return (
      <div className={styles.mission} data-state={state} aria-disabled="true">
        {body}
      </div>
    );
  }
  return (
    <Link
      className={styles.mission}
      data-state={state}
      data-current={current || undefined}
      href={`/linux/${mission.id}`}
      aria-label={`${mission.order}. ${t(mission.title)}: ${t(state === 'done' ? UI.replayMission : UI.playMission)}`}
    >
      {body}
    </Link>
  );
}

/** Zones and missions with locked, open and done states (PRD section 8). */
export function MissionMap() {
  const t = useText();
  const progress = useProgress((s) => s.progress.linux);
  const zones = missionMap(missions, progress);

  useEffect(() => {
    void getProgressStore()
      .getState()
      .loadProgress('linux')
      .catch(() => {});
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.back} href="/linux">
          {t(UI.backToTitle)}
        </Link>
        <h1 className={styles.title}>
          {GAME_TITLE}: {t(UI.missionMap)}
        </h1>
      </header>
      <ol className={styles.zones}>
        {zones.map(({ zone, missions: entries }) => (
          <li
            key={zone.id}
            className={styles.zone}
            style={{ '--zone': zone.color } as CSSProperties}
          >
            <h2 className={styles.zoneTitle}>{t(zone.title)}</h2>
            {entries.length ? (
              <ol className={styles.missions}>
                {entries.map((entry) => (
                  <li key={entry.mission.id}>
                    <MissionCard entry={entry} />
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.coming}>{t(UI.zoneComing)}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
