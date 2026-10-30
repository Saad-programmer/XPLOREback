'use client';

import { useEffect, useState } from 'react';
import { GUIDE_NAME } from '../meta';
import { UI } from '../strings';
import { useGame, useGameStore, useReducedMotion, useText } from './game-context';
import styles from './DialogueBox.module.css';
import { Penguin, preloadPenguinFaces } from './Penguin';
import { linuxSound } from './sound';

const CHAR_MS = 22;

/** Typewriter text. Click shows the whole line; a second click goes on. */
function TypedLine({ text, onDone }: { text: string; onDone: () => void }) {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(reducedMotion ? text.length : 0);
  const complete = shown >= text.length;

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

  return (
    <p className={styles.text} onClick={() => (complete ? onDone() : setShown(text.length))}>
      {/* Screen readers get the whole line at once. */}
      <span className="visually-hidden" aria-live="polite">
        {text}
      </span>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        <span className={styles.rest}>{text.slice(shown)}</span>
      </span>
    </p>
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
  const last = dialogue.index === dialogue.lines.length - 1;
  const next = () => store.getState().nextLine();

  if (hidden) {
    return (
      <div className={styles.collapsed}>
        <button
          type="button"
          className={styles.reopen}
          onClick={() => store.getState().setDialogueHidden(false)}
        >
          <Penguin key={line.mood} mood={line.mood} size={28} />
          {t(UI.expand)}
        </button>
      </div>
    );
  }

  return (
    <aside className={styles.box} aria-label={GUIDE_NAME} data-kind={dialogue.kind}>
      <div className={styles.portrait} data-augmented-ui="tl-clip br-clip border">
        <Penguin key={line.mood} mood={line.mood} size={80} />
      </div>
      <div className={styles.body}>
        <span className={styles.name}>{GUIDE_NAME}</span>
        <TypedLine key={`${dialogue.id}:${dialogue.index}`} text={t(line.text)} onDone={next} />
      </div>
      <div className={styles.actions}>
        {!(last && dialogue.kind === 'victory') && (
          <button
            type="button"
            className={styles.next}
            onClick={next}
            data-augmented-ui="tr-clip bl-clip"
          >
            {t(UI.next)}
            {dialogue.lines.length > 1 && (
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
    </aside>
  );
}
