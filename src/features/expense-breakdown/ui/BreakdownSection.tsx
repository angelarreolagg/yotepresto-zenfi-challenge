import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { computeSummary, useTransactionStore } from '@/entities/transaction';

import { computeCategoryBreakdown, groupSmallSlicesAsOthers } from '../lib/categoryBreakdown';
import { computeInsight } from '../lib/insight';
import { CategoryBreakdownList } from './CategoryBreakdownList';
import { ExpenseChart } from './ExpenseChart';
import { InsightLine } from './InsightLine';
import { SummaryStrip } from './SummaryStrip';

const CHART_GROUPING_THRESHOLD_PERCENT = 5;

/**
 * The month analysis card (ROADMAP §6.3) — answers G1. Selects the raw `transactions` array and
 * derives everything else with `useMemo` in the component: building a derived array inside the
 * selector itself would be a new reference on every render and an infinite loop (CODESTYLE §6).
 */
export function BreakdownSection() {
  const { t } = useTranslation();
  const transactions = useTransactionStore((state) => state.transactions);

  const breakdown = useMemo(() => computeCategoryBreakdown(transactions), [transactions]);
  const summary = useMemo(() => computeSummary(transactions), [transactions]);
  const chartSlices = useMemo(
    () => groupSmallSlicesAsOthers(breakdown, CHART_GROUPING_THRESHOLD_PERCENT),
    [breakdown],
  );
  const insight = useMemo(() => computeInsight(breakdown), [breakdown]);

  return (
    <section
      data-onboarding="breakdown"
      className="flex flex-col gap-2.5 rounded-2xl bg-surface p-3 sm:gap-3 sm:p-4 lg:h-full"
    >
      {breakdown.length === 0 ? (
        <p className="text-sm text-text-secondary">{t('expenseBreakdown.empty')}</p>
      ) : (
        <>
          <ExpenseChart slices={chartSlices} totalExpenses={summary.totalExpenses} />
          <InsightLine insight={insight} />
          <CategoryBreakdownList breakdown={breakdown} />
        </>
      )}
      <SummaryStrip totalIncome={summary.totalIncome} netFlow={summary.netFlow} />
    </section>
  );
}
