import { useMemo, useState } from 'react';
import { ChevronDown, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Transaction } from '@/entities/transaction';
import { useLocale } from '@/shared/i18n/useLocale';
import { cn } from '@/shared/lib/cn';
import { formatCurrency, formatForeignAmount } from '@/shared/lib/format';

import { computeTransactionNotes } from '../lib/transactionNotes';

interface TransactionDetailsProps {
  transaction: Transaction;
}

/**
 * A collapsed `surface-sunken` panel with a warning count (ROADMAP §6.6): a status/reference/
 * account list, then one note per active flag. Every note says what the flag did to the number —
 * "possible duplicate" alone is trivia; the reason the total doesn't match a naive sum is the
 * point.
 */
export function TransactionDetails({ transaction }: TransactionDetailsProps) {
  const { t } = useTranslation();
  const { intlLocale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const notes = useMemo(() => computeTransactionNotes(transaction), [transaction]);

  return (
    <div className="rounded-xl bg-surface-sunken/70 p-3 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium transition-transform active:scale-[0.97]"
      >
        <span className="flex-1">{t('transactionList.details.title')}</span>
        {notes.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
            <TriangleAlert size={12} aria-hidden />
            {t('transactionList.details.warningCount', { count: notes.length })}
          </span>
        )}
        <ChevronDown
          size={16}
          aria-hidden
          className={cn(
            'shrink-0 text-text-secondary transition-transform duration-250',
            expanded && 'rotate-180',
          )}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="flex min-h-0 flex-col gap-3 overflow-hidden" inert={!expanded}>
          <dl className="flex flex-col gap-1.5 pt-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-text-secondary">{t('transactionList.details.statusLabel')}</dt>
              <dd>{t(`transactionList.status.${transaction.status}`)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-text-secondary">{t('transactionList.details.referenceLabel')}</dt>
              <dd className="truncate">{transaction.id}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-text-secondary">{t('transactionList.details.accountLabel')}</dt>
              <dd>
                {transaction.account === ''
                  ? t('transactionList.row.noAccount')
                  : transaction.account}
              </dd>
            </div>
          </dl>

          {notes.length > 0 && (
            <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs text-text-secondary">
              {notes.map((note) => (
                <li key={note.key}>
                  {note.key === 'transactionList.details.foreignCurrency'
                    ? t(note.key, {
                        native: formatForeignAmount(note.amount, note.currency, intlLocale),
                        converted: formatCurrency(note.amountMXN, intlLocale),
                      })
                    : t(note.key)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
