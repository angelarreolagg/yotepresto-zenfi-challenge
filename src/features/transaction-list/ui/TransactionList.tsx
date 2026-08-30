import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { scopeToPeriod, useTransactionStore } from '@/entities/transaction';

import {
  EMPTY_FILTERS,
  applyFilters,
  isFiltersActive,
  type TransactionFilters as Filters,
} from '../lib/filters';
import { listWeeksInPeriod, scopeToWeek, summarizeWeek } from '../lib/weeks';
import { EditCategoryModal } from './EditCategoryModal';
import { TransactionFilters } from './TransactionFilters';
import { TransactionRow } from './TransactionRow';
import { WeekNavigator } from './WeekNavigator';

/** { period, index } rather than a bare index — comparing against the current period is what
 * lets a week choice from another month simply stop applying, with no effect needed to reset it
 * (ROADMAP §5.6). */
interface WeekSelection {
  period: string;
  index: number;
}

export function TransactionList() {
  const { t } = useTranslation();
  const selectedPeriod = useTransactionStore((state) => state.selectedPeriod);
  const allTransactions = useTransactionStore((state) => state.transactions);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [weekSelection, setWeekSelection] = useState<WeekSelection | null>(null);

  const periodTransactions = useMemo(
    () => scopeToPeriod(allTransactions, selectedPeriod),
    [allTransactions, selectedPeriod],
  );
  const weeks = useMemo(
    () => listWeeksInPeriod(periodTransactions, selectedPeriod),
    [periodTransactions, selectedPeriod],
  );

  // The default is the most recent week, derived every render rather than reset by an effect.
  const defaultIndex = Math.max(weeks.length - 1, 0);
  const activeWeekIndex =
    weekSelection !== null && weekSelection.period === selectedPeriod
      ? Math.min(weekSelection.index, defaultIndex)
      : defaultIndex;
  const activeWeek = weeks[activeWeekIndex];

  const filtersActive = isFiltersActive(filters);
  const sourceRows =
    filtersActive || activeWeek === undefined
      ? periodTransactions
      : scopeToWeek(periodTransactions, activeWeek);
  const visibleRows = useMemo(
    () =>
      [...applyFilters(sourceRows, filters)].sort((a, b) => b.date.getTime() - a.date.getTime()),
    [sourceRows, filters],
  );

  const goToPreviousWeek = () => {
    if (activeWeekIndex <= 0) return;
    setWeekSelection({ period: selectedPeriod, index: activeWeekIndex - 1 });
  };
  const goToNextWeek = () => {
    if (activeWeekIndex >= weeks.length - 1) return;
    setWeekSelection({ period: selectedPeriod, index: activeWeekIndex + 1 });
  };

  const rowsKey = filtersActive
    ? 'filtered'
    : activeWeek
      ? `${activeWeek.startDateKey}_${activeWeek.endDateKey}`
      : 'none';

  let emptyMessageKey: string | null = null;
  if (periodTransactions.length === 0) emptyMessageKey = 'transactionList.empty.noRows';
  else if (visibleRows.length === 0)
    emptyMessageKey = filtersActive
      ? 'transactionList.empty.filtered'
      : 'transactionList.empty.week';

  return (
    <section className="flex flex-col gap-2.5 rounded-2xl bg-surface p-3 sm:gap-4 sm:p-4">
      <h2 className="sr-only text-lg font-bold sm:not-sr-only">{t('transactionList.title')}</h2>

      <TransactionFilters
        transactions={periodTransactions}
        filters={filters}
        onChange={setFilters}
      />

      {filtersActive ? (
        <p className="text-xs text-text-secondary">{t('transactionList.filters.activeNotice')}</p>
      ) : (
        activeWeek !== undefined && (
          <WeekNavigator
            week={activeWeek}
            rowCount={scopeToWeek(periodTransactions, activeWeek).length}
            summary={summarizeWeek(periodTransactions, activeWeek)}
            canGoPrevious={activeWeekIndex > 0}
            canGoNext={activeWeekIndex < weeks.length - 1}
            onPrevious={goToPreviousWeek}
            onNext={goToNextWeek}
          />
        )
      )}

      {emptyMessageKey !== null ? (
        <p className="py-6 text-center text-sm text-text-secondary">{t(emptyMessageKey)}</p>
      ) : (
        <ul
          key={rowsKey}
          className="flex animate-fade-in flex-col gap-1 sm:max-h-[25.5rem] sm:gap-1.5 lg:max-h-[25.5rem] lg:overflow-y-auto lg:pr-1 scroll-slim"
        >
          {visibleRows.map((transaction, index) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              isOnboardingAnchor={index === 0}
            />
          ))}
        </ul>
      )}

      <EditCategoryModal />
    </section>
  );
}
