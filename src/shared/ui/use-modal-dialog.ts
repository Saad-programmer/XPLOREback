'use client';

import { useEffect, useRef } from 'react';

/**
 * Opens a <dialog> as a modal while the component is mounted.
 *
 * - It closes when the component unmounts or its page is hidden: Next.js keeps
 *   visited pages alive, and a modal left open there makes the next page inert.
 * - `onClose` runs only when the player closes it (button, Esc, backdrop), never
 *   for that cleanup close. Otherwise React's development double mount (mount,
 *   cleanup, mount) closes the dialog right after opening it.
 */
export function useModalDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // The browser delivers the close event later than close(). After React's
    // double mount (close, then showModal again) that late event reaches this
    // listener while the dialog is open again: it is stale, so ignore it.
    const handleClose = () => {
      if (!element.open) onCloseRef.current();
    };
    element.addEventListener('close', handleClose);
    if (!element.open) element.showModal();
    return () => {
      // Remove the listener first: this close is ours, not the player's.
      element.removeEventListener('close', handleClose);
      element.close();
    };
  }, []);

  return ref;
}
