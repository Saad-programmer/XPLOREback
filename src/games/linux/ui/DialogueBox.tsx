'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DialogueLine } from '../content/schema';
import { dialogueStyle, type DialogueIcon } from '../dialogue-style';
import type { Dialogue } from '../game-store';
import { GUIDE_NAME } from '../meta';
import { UI } from '../strings';
import { useGame, useGameStore, useReducedMotion, useText } from './game-context';
import styles from './DialogueBox.module.css';
import { Penguin, preloadPenguinFaces } from './Penguin';
import { linuxSound } from './sound';

const CHAR_MS = 22;

/** Small icon before the name tag, one per kind of line. */
function TagIcon({ icon, label }: { icon: Exclude<DialogueIcon, null>; label: string }) {
  const paths = {
    hint: 'M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 19h6v2H9z',
    mistake: 'M10.5 3h3l-.5 12h-2zM10.5 17.5h3v3h-3z',
    victory: 'm12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z',
  };
  return (
    <svg className={styles.tagIcon} viewBox="0 0 24 24" fill="currentColor" role="img">
      <title>{label}</title>
      <path d={paths[icon]} />
    </svg>
  );
}

/** Enter and Space advance the dialogue, except while the player types or uses a control. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest('input, textarea, select, button, a, [role="dialog"], dialog, .xterm') !== null
  );
}

/** One line of the dialogue: typewriter, Skip then Next. Remounted for every line. */
function OpenDialogue({ dialogue, line }: { dialogue: Dialogue; line: DialogueLine }) {
  const t = useText();
  const store = useGameStore();
  const reducedMotion = useReducedMotion();
  const text = t(line.text);
  const [shown, setShown] = useState(reducedMotion ? text.length : 0);
  const complete = shown >= text.length;
  const last = dialogue.index === dialogue.lines.length - 1;
  const canGoOn = !(last && dialogue.kind === 'victory');
  const { tone, icon } = dialogueStyle(dialogue.kind, line.mood);

  useEffect(() => {
    if (complete) return;
    let ticks = 0;
    const timer = setInterval(() => {
      // A short, high blip every few letters (PRD section 6).
      if (ticks++ % 3 === 0) linuxSound.play('blip', 'voice');
      setShown((n) => Math.min(n + 1, text.length));
    }, CHAR_MS);
    return () => clearInterval(timer);
  }, [complete, text.length]);

  const advance = useCallback(() => {
    if (!complete) setShown(text.length);
    else if (canGoOn) store.getState().nextLine();
  }, [complete, canGoOn, text.length, store]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey)
        return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  const iconLabel = {
    hint: t(UI.lineHint),
    mistake: t(UI.lineMistake),
    victory: t(UI.lineVictory),
  };

  return (
    <aside
      className={styles.box}
      aria-label={GUIDE_NAME}
      data-kind={dialogue.kind}
      data-tone={tone}
      data-typing={complete ? undefined : ''}
    >
      <div className={styles.inner}>
        <span className={styles.rail} aria-hidden="true" />
        <span className={styles.leds} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={`${styles.screw} ${styles.s1}`} aria-hidden="true" />
        <span className={`${styles.screw} ${styles.s2}`} aria-hidden="true" />
        <span className={`${styles.screw} ${styles.s3}`} aria-hidden="true" />

        <div className={styles.bay}>
          <span className={styles.floor} aria-hidden="true" />
          <Penguin key={line.mood} mood={line.mood} size={84} />
          {tone === 'victory' && (
            <span className={styles.sparks} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          )}
        </div>

        <div className={styles.copy}>
          <span className={styles.tag}>
            {icon && <TagIcon icon={icon} label={iconLabel[icon]} />}
            {GUIDE_NAME.toUpperCase()}
            <span className={styles.role} aria-hidden="true">
              {' // '}
              {t(UI.guideRole).toUpperCase()}
            </span>
          </span>
          <p className={styles.text} onClick={advance}>
            {/* Screen readers get the whole line at once. */}
            <span className="visually-hidden" aria-live="polite">
              {text}
            </span>
            <span aria-hidden="true">
              {text.slice(0, shown)}
              {!complete && <span className={styles.caret} />}
              <span className={styles.rest}>{text.slice(shown)}</span>
            </span>
          </p>
        </div>

        <div className={styles.actions}>
          {(!complete || canGoOn) && (
            <button type="button" className={styles.next} onClick={advance}>
              {complete ? t(UI.next) : t(UI.skip)}
              {complete && dialogue.lines.length > 1 && (
                <span className={styles.step}>
                  {dialogue.index + 1}/{dialogue.lines.length}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            className={styles.minimize}
            onClick={() => store.getState().setDialogueHidden(true)}
            aria-label={t(UI.minimize)}
            title={t(UI.minimize)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 10h10" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

export function DialogueBox() {
  const t = useText();
  const store = useGameStore();
  const dialogue = useGame((s) => s.dialogue);
  const hidden = useGame((s) => s.dialogueHidden);
  useEffect(() => preloadPenguinFaces(), []);
  if (!dialogue) return null;

  const line = dialogue.lines[dialogue.index];

  if (hidden) {
    const { tone } = dialogueStyle(dialogue.kind, line.mood);
    const more = dialogue.index < dialogue.lines.length - 1;
    return (
      <div className={styles.collapsed} data-tone={tone}>
        <button
          type="button"
          className={styles.reopen}
          onClick={() => store.getState().setDialogueHidden(false)}
          aria-label={t(UI.expand)}
        >
          <span className={styles.face}>
            <Penguin key={line.mood} mood={line.mood} size={52} />
            {more && <span className={styles.dot} aria-hidden="true" />}
          </span>
          <span className={styles.reopenText} aria-hidden="true">
            <b>{GUIDE_NAME.toUpperCase()}</b>
            {t(UI.reopen)}
          </span>
        </button>
      </div>
    );
  }

  return <OpenDialogue key={`${dialogue.id}:${dialogue.index}`} dialogue={dialogue} line={line} />;
}
