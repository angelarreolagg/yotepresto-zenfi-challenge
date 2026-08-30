import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  title: ReactNode;
  children: ReactNode;
  /** `alertdialog` for a destructive confirmation; `dialog` (default) for everything else. */
  variant?: 'dialog' | 'alertdialog';
}

/**
 * Bottom sheet on a phone, centred from `sm` (ROADMAP §6.6) — the same markup switches
 * animation via a responsive Tailwind variant (sheet-in below `sm`, dialog-in from it) rather
 * than branching in JS. Portaled to `document.body` so it can never be trapped inside a
 * transformed ancestor (STYLEGUIDE §8), and unmounts instead of exit-animating: a missing 160ms
 * fade-out beats an invisible click trap left by an exit animation that never reports back.
 */
export function Modal({
  isOpen,
  onClose,
  titleId,
  title,
  children,
  variant = 'dialog',
}: ModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden onClick={onClose} className="fixed inset-0 animate-fade-in bg-black/60" />
      <div
        role={variant}
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative flex max-h-[90dvh] w-full animate-sheet-in flex-col gap-4 overflow-y-auto rounded-t-2xl bg-surface p-4',
          'sm:max-w-md sm:animate-dialog-in sm:rounded-2xl',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            aria-label={t('app.dialog.close')}
            onClick={onClose}
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-transform active:scale-90"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
