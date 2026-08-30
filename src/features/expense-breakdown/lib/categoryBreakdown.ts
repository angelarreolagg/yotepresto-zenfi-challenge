import {
  getTransactionKind,
  isSpendEligible,
  type Category,
  type Transaction,
} from '@/entities/transaction';

export interface CategoryBreakdownItem {
  category: Category;
  totalMXN: number;
  /** 0-100, of total eligible spend. */
  percentage: number;
}

/**
 * Sums amountMXN *signed* per category and drops anything not positive — a refund inside a
 * category nets against it for free this way, with no separate "refunds" bucket to maintain.
 */
export function computeCategoryBreakdown(transactions: Transaction[]): CategoryBreakdownItem[] {
  const totals = new Map<Category, number>();

  for (const transaction of transactions) {
    if (!isSpendEligible(transaction)) continue;
    if (getTransactionKind(transaction) !== 'gasto') continue;

    const spend = -transaction.metadata.amountMXN;
    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + spend);
  }

  const positive = [...totals.entries()].filter(([, total]) => total > 0);
  const grandTotal = positive.reduce((sum, [, total]) => sum + total, 0);

  return positive
    .map(([category, totalMXN]) => ({
      category,
      totalMXN,
      percentage: grandTotal > 0 ? (totalMXN / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.totalMXN - a.totalMXN);
}

export interface ChartSlice {
  /** null marks the synthesized "Otros" bucket — never a value a real transaction carries. */
  category: Category | null;
  totalMXN: number;
  percentage: number;
}

/**
 * Groups slices under `threshold`% into one "Otros" bucket for the chart only — the list below
 * still shows every category. With rent at ~61% of the month, a raw pie is one huge arc plus a
 * fringe of unreadable crumbs (STYLEGUIDE §7).
 */
export function groupSmallSlicesAsOthers(
  breakdown: CategoryBreakdownItem[],
  threshold = 5,
): ChartSlice[] {
  const kept = breakdown.filter((item) => item.percentage >= threshold);
  const small = breakdown.filter((item) => item.percentage < threshold);

  const slices: ChartSlice[] = kept.map(({ category, totalMXN, percentage }) => ({
    category,
    totalMXN,
    percentage,
  }));

  if (small.length > 0) {
    slices.push({
      category: null,
      totalMXN: small.reduce((sum, item) => sum + item.totalMXN, 0),
      percentage: small.reduce((sum, item) => sum + item.percentage, 0),
    });
  }

  return slices;
}
