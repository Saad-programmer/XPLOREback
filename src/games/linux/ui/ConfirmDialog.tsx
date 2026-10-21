'use client';

import { useModalDialog } from '@/src/shared/ui/use-modal-dialog';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * In-game confirmation, instead of the browser's confirm() popup: that popup
 * freezes the page, looks foreign, and Chrome can silently answer "Cancel" if
 * the player once ticked "Prevent this page from creating additional dialogs".
 */
export function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Esc and the backdrop count as Cancel.
  const dialog = useModalDialog(onCancel);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-augmented-ui="tl-clip br-clip border"
      onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
    >
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancel}
          onClick={() => dialog.current?.close()}
          autoFocus
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={styles.confirm}
          onClick={onConfirm}
          data-augmented-ui="tr-clip bl-clip"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
