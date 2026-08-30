import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type Summary } from '@/entities/transaction';
import { useLocale } from '@/shared/i18n/useLocale';
import { MINUS_SIGN, formatCurrency, formatDateFromKey } from '@/shared/lib/format';

import type { WeekRange } from '../lib/weeks';

interface WeekNavigatorProps {
  week: WeekRange;
  rowCount: number;
  summary: Summary;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * A `surface-sunken` block with two arrows and everything else between them, in two lines
 * (ROADMAP §6.5): the range + row count, then income and expenses. Arrows stop at the month's
 * edges, and the anchor is one of the three onboarding steps (§6.7) — it's the one that shows
 * the correction survives a week change.
 */
export function WeekNavigator({
  week,
  rowCount,
  summary,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: WeekNavigatorProps) {
  const { t } = useTranslation();
  const { intlLocale } = useLocale();

  const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const rangeLabel = `${formatDateFromKey(week.startDateKey, intlLocale, dateOptions, true)}–${formatDateFromKey(week.endDateKey, intlLocale, dateOptions, true)}`;

  return (
    <div
      data-onboarding="week-navigator"
      className="flex items-center gap-1 rounded-xl bg-surface-sunken/70 p-2 backdrop-blur-md"
    >
      <button
        type="button"
        aria-label={t('transactionList.week.previous')}
        disabled={!canGoPrevious}
        onClick={onPrevious}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-transform active:scale-90 disabled:opacity-30 disabled:active:scale-100"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex-1 text-center">
        <p className="text-sm font-medium">
          {rangeLabel} · {t('transactionList.week.rowCount', { count: rowCount })}
        </p>
        <p className="text-xs tabular-nums text-text-secondary">
          <span className="text-positive">+{formatCurrency(summary.totalIncome, intlLocale)}</span>
          {' · '}
          <span>
            {MINUS_SIGN}
            {formatCurrency(summary.totalExpenses, intlLocale)}
          </span>
        </p>
      </div>

      <button
        type="button"
        aria-label={t('transactionList.week.next')}
        disabled={!canGoNext}
        onClick={onNext}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-transform active:scale-90 disabled:opacity-30 disabled:active:scale-100"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
