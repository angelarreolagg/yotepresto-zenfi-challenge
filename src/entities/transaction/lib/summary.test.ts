import { describe, expect, it } from 'vitest';

import { rawDataset } from '../api/dataset';
import { normalizeAll } from '../model/normalize';
import { applyPeriod } from './periods';
import { computeSummary } from './summary';

describe('computeSummary — characterization against the real dataset (ROADMAP §7)', () => {
  const august = applyPeriod(normalizeAll(rawDataset.movimientos), '2026-08');
  const summary = computeSummary(august);

  it('matches the audited August 2026 totals exactly', () => {
    expect(summary.totalIncome).toBeCloseTo(21650.0, 5);
    expect(summary.totalExpenses).toBeCloseTo(79861.15, 5);
    expect(summary.netFlow).toBeCloseTo(-58211.15, 5);
  });

  it('is nowhere near the naive (unexcluded, unsigned) net of -69,967.35', () => {
    expect(summary.netFlow).not.toBeCloseTo(-69967.35, 0);
  });
});

describe('computeSummary — each exclusion in isolation', () => {
  const august = applyPeriod(normalizeAll(rawDataset.movimientos), '2026-08');
  const byId = new Map(august.map((transaction) => [transaction.id, transaction]));

  function get(id: string) {
    const transaction = byId.get(id);
    if (!transaction) throw new Error(`fixture missing: ${id}`);
    return transaction;
  }

  it('excludes an out-of-period row entirely', () => {
    const withoutSeptember = computeSummary([get('txn_001')]);
    const withSeptember = computeSummary([
      get('txn_001'),
      // txn_060 belongs to September; scoped to August it is flagged out-of-period.
      ...applyPeriod(normalizeAll(rawDataset.movimientos), '2026-08').filter(
        (t) => t.id === 'txn_060',
      ),
    ]);
    expect(withSeptember).toEqual(withoutSeptember);
  });

  it('counts a duplicate pair once, not twice', () => {
    const both = computeSummary([get('txn_021'), get('txn_022')]);
    const once = computeSummary([get('txn_021')]);
    expect(both).toEqual(once);
  });

  it('nets a refund against its category instead of booking it as income', () => {
    const purchaseThenRefund = computeSummary([get('txn_007'), get('txn_028')]);
    expect(purchaseThenRefund.totalExpenses).toBeCloseTo(0, 5);
    expect(purchaseThenRefund.totalIncome).toBe(0);
  });

  it('excludes a transfer from both income and expenses', () => {
    expect(computeSummary([get('txn_010')])).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
    });
  });

  it('excludes a disputed row', () => {
    expect(computeSummary([get('txn_061')])).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
    });
  });
});
