'use client';

import { useId } from 'react';
import type { Settings } from '@/src/shared/bridge/types';
import { useProgress } from '@/src/shared/progress';
import { UI } from '../strings';
import { useText } from './game-context';
import { Icon } from './Icon';
import styles from './SettingsMenu.module.css';

type Toggle = 'muted' | 'memeSounds' | 'reducedMotion' | 'classicCursor';

/** Sound, meme sounds, reduced motion and language (PRD sections 7 and 8). Uses the HTML popover API. */
export function SettingsMenu({
  buttonClass,
  menuClass,
  textButton = false,
}: {
  buttonClass: string;
  /** Extra class for the panel (e.g. centred on the title screen). */
  menuClass?: string;
  /** Show the word "Settings" instead of the gear icon. */
  textButton?: boolean;
}) {
  const t = useText();
  const id = useId();
  const settings = useProgress((s) => s.settings);
  const updateSettings = useProgress((s) => s.updateSettings);

  const toggles: { key: Toggle; label: string; checked: boolean }[] = [
    { key: 'muted', label: t(UI.sound), checked: !settings.muted },
    { key: 'memeSounds', label: t(UI.memeSounds), checked: settings.memeSounds },
    { key: 'reducedMotion', label: t(UI.reducedMotion), checked: settings.reducedMotion },
    { key: 'classicCursor', label: t(UI.classicCursor), checked: settings.classicCursor },
  ];
  const flip = (key: Toggle) => updateSettings({ [key]: !settings[key] } as Partial<Settings>);

  return (
    <>
      <button
        type="button"
        className={buttonClass}
        popoverTarget={id}
        title={textButton ? undefined : t(UI.settings)}
        aria-label={textButton ? undefined : t(UI.settings)}
      >
        {textButton ? t(UI.settings) : <Icon name="settings" label={t(UI.settings)} />}
      </button>
      <div id={id} popover="auto" className={`${styles.menu} ${menuClass ?? ''}`}>
        <h2 className={styles.title}>{t(UI.settings)}</h2>
        {toggles.map((toggle) => (
          <label key={toggle.key} className={styles.row}>
            <input type="checkbox" checked={toggle.checked} onChange={() => flip(toggle.key)} />
            {toggle.label}
          </label>
        ))}
        <fieldset className={styles.language}>
          <legend>{t(UI.language)}</legend>
          {(['fr', 'en'] as const).map((lang) => (
            <label key={lang} className={styles.row}>
              <input
                type="radio"
                name={`${id}-lang`}
                checked={settings.language === lang}
                onChange={() => updateSettings({ language: lang })}
              />
              {lang === 'fr' ? 'Français' : 'English'}
            </label>
          ))}
        </fieldset>
      </div>
    </>
  );
}
