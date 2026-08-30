import { afterEach, describe, expect, it } from 'vitest';

import { computeSummary, useTransactionStore } from '@/entities/transaction';

import { listWeeksInPeriod, scopeToWeek, summarizeWeek } from './weeks';

const initialState = useTransactionStore.getState();

afterEach(() => {
  useTransactionStore.setState(initialState, true);
});

describe('listWeeksInPeriod — characterization against ROADMAP §2/§7', () => {
  it('splits August 2026 into exactly 4 weeks holding 8 · 21 · 22 · 8 rows', () => {
    const transactions = useTransactionStore.getState().transactions;
    const weeks = listWeeksInPeriod(transactions, '2026-08');
    const counts = weeks.map((week) => scopeToWeek(transactions, week).length);
    expect(counts).toEqual([8, 21, 22, 8]);
  });

  it('gives November 2025 and September 2026 a single week each', () => {
    for (const period of ['2025-11', '2026-09']) {
      useTransactionStore.getState().setPeriod(period);
      const scoped = useTransactionStore.getState().transactions;
      const weeks = listWeeksInPeriod(scoped, period);
      expect(weeks).toHaveLength(1);
      expect(scopeToWeek(scoped, weeks[0]!)).toHaveLength(1);
    }
  });

  it("clamps a week to the calendar month, never showing an adjacent month's dates", () => {
    const transactions = useTransactionStore.getState().transactions;
    const weeks = listWeeksInPeriod(transactions, '2026-08');
    for (const week of weeks) {
      expect(week.startDateKey.startsWith('2026-08')).toBe(true);
      expect(week.endDateKey.startsWith('2026-08')).toBe(true);
    }
  });

  it('returns an empty list for a period with no transactions', () => {
    expect(listWeeksInPeriod([], '2030-01')).toEqual([]);
  });
});

describe('scopeToWeek', () => {
  it('includes both boundary dates', () => {
    const week = { startDateKey: '2026-08-10', endDateKey: '2026-08-16' };
    const transactions = useTransactionStore.getState().transactions;
    const scoped = scopeToWeek(transactions, week);
    expect(
      scoped.every((t) => t.dateKey >= week.startDateKey && t.dateKey <= week.endDateKey),
    ).toBe(true);
    expect(scoped.some((t) => t.dateKey === week.startDateKey)).toBe(true);
  });
});

describe('summarizeWeek', () => {
  it('sums to the same monthly summary across all four August weeks', () => {
    const transactions = useTransactionStore.getState().transactions;
    const weeks = listWeeksInPeriod(transactions, '2026-08');

    const combined = weeks.reduce(
      (totals, week) => {
        const weekSummary = summarizeWeek(transactions, week);
        return {
          totalIncome: totals.totalIncome + weekSummary.totalIncome,
          totalExpenses: totals.totalExpenses + weekSummary.totalExpenses,
          netFlow: totals.netFlow + weekSummary.netFlow,
        };
      },
      { totalIncome: 0, totalExpenses: 0, netFlow: 0 },
    );

    const monthly = computeSummary(transactions);
    expect(combined.totalIncome).toBeCloseTo(monthly.totalIncome, 5);
    expect(combined.totalExpenses).toBeCloseTo(monthly.totalExpenses, 5);
    expect(combined.netFlow).toBeCloseTo(monthly.netFlow, 5);
  });
});
