import { describe, expect, it } from 'vitest';

// The store, via the entities barrel, is how a feature actually gets real transactions — not by
// reaching for normalizeAll/rawDataset directly, which the barrel deliberately doesn't export.
import { useTransactionStore } from '@/entities/transaction';

import { computeCategoryBreakdown, groupSmallSlicesAsOthers } from './categoryBreakdown';

// The store resolves to the file's declared period (2026-08) with no persisted state.
const august = useTransactionStore.getState().transactions;

describe('computeCategoryBreakdown — characterization against ROADMAP §7', () => {
  const breakdown = computeCategoryBreakdown(august);

  it('has exactly 11 categories, matching the audited count', () => {
    expect(breakdown).toHaveLength(11);
  });

  it('sums to the same total as computeSummary', () => {
    const total = breakdown.reduce((sum, item) => sum + item.totalMXN, 0);
    expect(total).toBeCloseTo(79861.15, 5);
  });

  it('ranks Vivienda first at roughly 61% of spend', () => {
    expect(breakdown[0]?.category).toBe('Vivienda');
    expect(breakdown[0]?.totalMXN).toBeCloseTo(48500, 5);
    expect(breakdown[0]?.percentage).toBeGreaterThan(60);
    expect(breakdown[0]?.percentage).toBeLessThan(61);
  });

  it('nets the Amazon refund against Compras instead of booking it as separate income', () => {
    const compras = breakdown.find((item) => item.category === 'Compras');
    // 1899 (txn_007) + 3450 (txn_029) + 2299 (txn_041) + 234 (txn_052) - 1899 (txn_028 refund)
    expect(compras?.totalMXN).toBeCloseTo(5983.0, 5);
  });

  it('is sorted descending by amount', () => {
    for (let i = 1; i < breakdown.length; i += 1) {
      expect(breakdown[i - 1]!.totalMXN).toBeGreaterThanOrEqual(breakdown[i]!.totalMXN);
    }
  });
});

describe('groupSmallSlicesAsOthers', () => {
  const breakdown = computeCategoryBreakdown(august);
  const slices = groupSmallSlicesAsOthers(breakdown, 5);

  it('keeps exactly the 4 categories at or above 5%, plus one Otros slice', () => {
    expect(slices).toHaveLength(5);
    expect(slices.filter((s) => s.category !== null).map((s) => s.category)).toEqual([
      'Vivienda',
      'Supermercado',
      'Compras',
      'Comida',
    ]);
    expect(slices.filter((s) => s.category === null)).toHaveLength(1);
  });

  it('the Otros slice sums every category below the threshold', () => {
    const others = slices.find((s) => s.category === null);
    const expected = breakdown
      .filter((item) => item.percentage < 5)
      .reduce((sum, item) => sum + item.totalMXN, 0);
    expect(others?.totalMXN).toBeCloseTo(expected, 5);
  });

  it('returns no Otros slice when nothing falls below the threshold', () => {
    const noGrouping = groupSmallSlicesAsOthers(breakdown, 0);
    expect(noGrouping.every((slice) => slice.category !== null)).toBe(true);
  });
});
