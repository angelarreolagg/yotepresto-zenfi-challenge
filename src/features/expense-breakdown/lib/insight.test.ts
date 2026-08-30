import { describe, expect, it } from 'vitest';

import type { CategoryBreakdownItem } from './categoryBreakdown';
import { FIXED_COST_THRESHOLD_PERCENT, computeInsight } from './insight';

function item(
  category: CategoryBreakdownItem['category'],
  totalMXN: number,
  percentage: number,
): CategoryBreakdownItem {
  return { category, totalMXN, percentage };
}

describe('computeInsight', () => {
  it('returns the empty key when there is nothing to report', () => {
    expect(computeInsight([])).toEqual({ key: 'expenseBreakdown.insight.empty' });
  });

  it('names the top category when it is below the fixed-cost threshold', () => {
    const breakdown = [item('Comida', 4264, 30), item('Compras', 3000, 20)];
    expect(computeInsight(breakdown)).toEqual({
      key: 'expenseBreakdown.insight.topCategory',
      category: 'Comida',
      amount: 4264,
      percentage: 30,
    });
  });

  it('switches to the dominant-fixed-cost variant above the threshold, naming the runner-up', () => {
    const breakdown = [
      item('Vivienda', 48500, 60.7),
      item('Supermercado', 11458.65, 14.3),
      item('Compras', 5983, 7.5),
    ];
    expect(computeInsight(breakdown)).toEqual({
      key: 'expenseBreakdown.insight.dominantFixedCost',
      fixedCategory: 'Vivienda',
      fixedPercentage: 60.7,
      category: 'Supermercado',
      amount: 11458.65,
    });
  });

  it('does not switch variants exactly at the threshold', () => {
    const breakdown = [item('Vivienda', 100, FIXED_COST_THRESHOLD_PERCENT), item('Comida', 60, 20)];
    expect(computeInsight(breakdown).key).toBe('expenseBreakdown.insight.topCategory');
  });

  it('falls back to topCategory when a dominant category has no runner-up to name', () => {
    const breakdown = [item('Vivienda', 48500, 100)];
    expect(computeInsight(breakdown)).toEqual({
      key: 'expenseBreakdown.insight.topCategory',
      category: 'Vivienda',
      amount: 48500,
      percentage: 100,
    });
  });
});
