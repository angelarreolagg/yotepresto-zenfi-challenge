import type { Category } from '@/entities/transaction';

import type { CategoryBreakdownItem } from './categoryBreakdown';

/**
 * Above this share of total spend, naming the top category is true but not actionable — "rent is
 * 61% of your month" tells nobody anything they can act on. Past it, the insight instead names
 * the biggest category someone could actually still move.
 */
export const FIXED_COST_THRESHOLD_PERCENT = 40;

/**
 * A translation key plus raw values, never a sentence: lib/ cannot import i18n, and a function
 * that builds text here could only ever speak one language. The presentation layer formats
 * `amount`/`percentage` for the active locale and interpolates via `<Trans>`.
 */
export type Insight =
  | { key: 'expenseBreakdown.insight.empty' }
  | {
      key: 'expenseBreakdown.insight.topCategory';
      category: Category;
      amount: number;
      percentage: number;
    }
  | {
      key: 'expenseBreakdown.insight.dominantFixedCost';
      fixedCategory: Category;
      fixedPercentage: number;
      category: Category;
      amount: number;
    };

export function computeInsight(breakdown: CategoryBreakdownItem[]): Insight {
  const top = breakdown[0];
  if (top === undefined) return { key: 'expenseBreakdown.insight.empty' };

  const second = breakdown[1];
  if (top.percentage > FIXED_COST_THRESHOLD_PERCENT && second !== undefined) {
    return {
      key: 'expenseBreakdown.insight.dominantFixedCost',
      fixedCategory: top.category,
      fixedPercentage: top.percentage,
      category: second.category,
      amount: second.totalMXN,
    };
  }

  return {
    key: 'expenseBreakdown.insight.topCategory',
    category: top.category,
    amount: top.totalMXN,
    percentage: top.percentage,
  };
}
