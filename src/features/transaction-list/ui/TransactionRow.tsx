import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Amount, CategoryIcon, FlagBadges, type Transaction } from '@/entities/transaction';
import { useLocale } from '@/shared/i18n/useLocale';
import { cn } from '@/shared/lib/cn';
import { formatDateFromKey } from '@/shared/lib/format';

import { useEditCategoryOverlay } from '../model/editCategoryOverlay';

const FLASH_DURATION_MS = 1400;

interface TransactionRowProps {
  transaction: Transaction;
  /** Marks the pencil button as the second onboarding anchor (ROADMAP §6.7) — always the first
   * visible row, since onboarding needs one stable element to point at. */
  isOnboardingAnchor?: boolean;
}

/**
 * ROADMAP §6.5: disc · description + date/category/status · MXN amount · pencil, with flag
 * badges indented below the text. The just-corrected flash fires when the modal *closes*, not
 * when the category is picked — flashing behind the dialog is flashing where nobody sees it.
 */
export function TransactionRow({ transaction, isOnboardingAnchor = false }: TransactionRowProps) {
  const { t } = useTranslation();
  const { intlLocale } = useLocale();
  const open = useEditCategoryOverlay((state) => state.open);
  const overlayOpen = useEditCategoryOverlay((state) => state.isOpen);
  const overlayPayload = useEditCategoryOverlay((state) => state.payload);

  const [flashing, setFlashing] = useState(false);
  const wasOpenForThisRow = useRef(false);

  useEffect(() => {
    const isOpenForThisRow = overlayOpen && overlayPayload?.transactionId === transaction.id;
    if (isOpenForThisRow) {
      wasOpenForThisRow.current = true;
      return;
    }
    if (!wasOpenForThisRow.current) return;

    wasOpenForThisRow.current = false;
    setFlashing(true);
    const timeout = window.setTimeout(() => setFlashing(false), FLASH_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [overlayOpen, overlayPayload, transaction.id]);

  const dateLabel = formatDateFromKey(transaction.dateKey, intlLocale, {
    day: 'numeric',
    month: 'short',
  });
  const statusLabel = t(`transactionList.status.${transaction.status}`);

  return (
    <li
      className={cn(
        'flex flex-col gap-1 rounded-xl px-1 py-2 transition-colors duration-500 sm:py-3',
        transaction.metadata.isPendingOrDisputed && 'opacity-60',
        transaction.metadata.isUncategorized && 'bg-warning/5',
        flashing && 'bg-accent/15',
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <CategoryIcon category={transaction.category} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium sm:text-base">{transaction.description}</p>
          <p className="truncate text-xs text-text-secondary sm:text-sm">
            {dateLabel} · {transaction.category} · {statusLabel}
          </p>
        </div>
        <Amount amountMXN={transaction.metadata.amountMXN} className="shrink-0" />
        <button
          type="button"
          data-onboarding={isOnboardingAnchor ? 'edit-button' : undefined}
          aria-label={t('transactionList.row.edit', { description: transaction.description })}
          onClick={() => open({ transactionId: transaction.id })}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary"
        >
          <Pencil size={15} />
        </button>
      </div>
      <FlagBadges metadata={transaction.metadata} className="pl-[3.125rem] sm:pl-[3.375rem]" />
    </li>
  );
}
