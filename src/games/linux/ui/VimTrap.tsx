'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { UI } from '../strings';
import { useGameStore, useText } from './game-context';
import styles from './VimTrap.module.css';

/** The fake vim: the only way out is to type :q! (PRD section 7). */
export function VimTrap() {
  const t = useText();
  const store = useGameStore();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const [tries, setTries] = useState(0);

  useEffect(() => input.current?.focus(), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (store.getState().vimCommand(value)) return;
    setTries((n) => n + 1);
    setMessage(
      value.startsWith(':') ? `E492: Not an editor command: ${value.slice(1)}` : '-- INSERT --',
    );
    setValue('');
  };

  return (
    <div className={styles.vim} onClick={() => input.current?.focus()}>
      <div className={styles.lines} aria-hidden="true">
        {Array.from({ length: 30 }, (_, i) => (
          <span key={i}>~</span>
        ))}
      </div>
      <form className={styles.status} onSubmit={submit}>
        <span className={styles.message}>{message || '"[No Name]" 0L, 0B'}</span>
        {tries >= 2 && <span className={styles.help}>{t(UI.vimHelp)}</span>}
        <input
          ref={input}
          className={styles.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label={t(UI.vimHelp)}
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
