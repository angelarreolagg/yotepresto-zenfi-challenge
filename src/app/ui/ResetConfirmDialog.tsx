import { useEffect, useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useTransactionStore } from '@/entities/transaction';

const WORKING_DURATION_MS = 550;

interface ResetConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * `alertdialog`, centred (ROADMAP §6.8). Confirming shows a spinner for 550ms before applying:
 * the reset is instant, but a destructive action with no acknowledgement reads as "nothing
 * happened" — and the locked window makes a double-submit impossible. Esc and the backdrop are
 * disabled while it works, which is the one case this app disables an overlay's usual escape
 * hatches on purpose.
 */
export function ResetConfirmDialog({ isOpen, onClose }: ResetConfirmDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [isWorking, setIsWorking] = useState(false);
  const resetToOriginal = useTransactionStore((state) => state.resetToOriginal);

  useEffect(() => {
    if (!isOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isWorking) onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, isWorking, onClose]);

  if (!isOpen) return null;

  const confirm = () => {
    setIsWorking(true);
    window.setTimeout(() => {
      resetToOriginal();
      // Reset before closing: onClose() hands control back to the parent, which may unmount
      // this component or reopen it fresh later — either way, isWorking must not still read true.
      setIsWorking(false);
      onClose();
    }, WORKING_DURATION_MS);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        onClick={isWorking ? undefined : onClose}
        className="fixed inset-0 animate-fade-in bg-black/60"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex w-full max-w-sm animate-dialog-in flex-col gap-4 rounded-2xl bg-surface p-4"
      >
        <h2 id={titleId} className="text-lg font-bold">
          {t('app.resetDialog.title')}
        </h2>
        <p className="text-sm text-text-secondary">{t('app.resetDialog.body')}</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isWorking}
            onClick={onClose}
            className="flex-1 rounded-xl bg-surface-raised py-2.5 text-sm font-semibold transition-transform active:scale-[0.97] disabled:opacity-50"
          >
            {t('app.resetDialog.cancel')}
          </button>
          <button
            type="button"
            disabled={isWorking}
            onClick={confirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-negative py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-70"
          >
            {isWorking ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              t('app.resetDialog.confirm')
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
