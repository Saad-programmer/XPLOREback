'use client';

import { useId, useState, type FormEvent } from 'react';
import { UI } from '../strings';
import { useGame, useGameStore, useText } from './game-context';
import styles from './PasswordBox.module.css';

export function PasswordBox() {
  const t = useText();
  const id = useId();
  const store = useGameStore();
  const phase = useGame((s) => s.phase);
  const wrong = useGame((s) => s.wrongPassword);
  const [value, setValue] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const correct = await store.getState().submitPassword(value);
    if (!correct) setShakeKey((key) => key + 1);
  };

  return (
    <form
      key={shakeKey}
      className={styles.form}
      data-wrong={(wrong && shakeKey > 0) || undefined}
      onSubmit={submit}
    >
      <label htmlFor={id} className={styles.label}>
        {t(UI.passwordLabel)}
      </label>
      <input
        id={id}
        className={styles.input}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        disabled={phase !== 'playing'}
        aria-invalid={wrong || undefined}
      />
      <button
        type="submit"
        className={styles.submit}
        data-augmented-ui="tr-clip bl-clip"
        disabled={phase !== 'playing' || !value.trim()}
      >
        {t(UI.passwordSubmit)}
      </button>
    </form>
  );
}
