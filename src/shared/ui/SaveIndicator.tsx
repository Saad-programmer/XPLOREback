'use client';

import { pickText, type LocalizedText } from '../i18n/text';
import { useProgress, type SaveStatus } from '../progress';
import styles from './SaveIndicator.module.css';

const LABELS: Record<SaveStatus, LocalizedText> = {
  idle: '',
  saving: { en: 'Saving…', fr: 'Sauvegarde…' },
  saved: { en: 'Saved', fr: 'Sauvegardé' },
  retrying: { en: 'Offline, will retry', fr: 'Hors ligne, nouvel essai bientôt' },
};

/** Small "saving… / saved" badge for the game top bar (PRD section 12). */
export function SaveIndicator() {
  const status = useProgress((state) => state.saveStatus);
  const lang = useProgress((state) => state.settings.language);
  if (status === 'idle') return null;
  return (
    <span className={styles.indicator} data-status={status} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden="true" />
      {pickText(LABELS[status], lang)}
    </span>
  );
}
