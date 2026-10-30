'use client';

import { useEffect } from 'react';
import { useProgress } from '../progress';

/** Applies the "Classic cursor" setting: app/cursors.css turns the pixel cursors off. */
export function CursorPreference() {
  const classic = useProgress((s) => s.settings.classicCursor);
  useEffect(() => {
    document.documentElement.toggleAttribute('data-classic-cursor', Boolean(classic));
  }, [classic]);
  return null;
}
