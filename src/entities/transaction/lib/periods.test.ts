import { describe, expect, it } from 'vitest';

import { rawDataset } from '../api/dataset';
import { normalizeAll } from '../model/normalize';
import { applyPeriod, listPeriods, scopeToPeriod } from './periods';

const transactions = normalizeAll(rawDataset.movimientos);

describe('listPeriods', () => {
  it('matches the three periods actually present in the dataset, sorted', () => {
    expect(listPeriods(transactions)).toEqual(['2025-11', '2026-08', '2026-09']);
  });
});

describe('scopeToPeriod', () => {
  it('returns exactly the 59 August rows, regardless of status or kind', () => {
    expect(scopeToPeriod(transactions, '2026-08')).toHaveLength(59);
  });

  it('returns the single row for each of the other two periods', () => {
    expect(scopeToPeriod(transactions, '2025-11')).toHaveLength(1);
    expect(scopeToPeriod(transactions, '2026-09')).toHaveLength(1);
  });
});

describe('applyPeriod', () => {
  it('flips isOutOfPeriod without changing the array length', () => {
    const scoped = applyPeriod(transactions, '2026-08');
    expect(scoped).toHaveLength(transactions.length);
    const outOfPeriod = scoped.filter((transaction) => transaction.metadata.isOutOfPeriod);
    expect(outOfPeriod.map((transaction) => transaction.id).sort()).toEqual(['txn_059', 'txn_060']);
  });

  it('returns the same object reference for a record whose flag does not change', () => {
    const first = applyPeriod(transactions, '2026-08');
    const second = applyPeriod(first, '2026-08');
    // Same period applied twice: nothing should have needed a new object.
    first.forEach((transaction, index) => {
      expect(second[index]).toBe(transaction);
    });
  });

  it('switching period back and forth does not lose a category correction', () => {
    const august = applyPeriod(transactions, '2026-08');
    const corrected = august.map((transaction) =>
      transaction.id === 'txn_005'
        ? { ...transaction, category: 'Transporte' as const }
        : transaction,
    );
    const toNovember = applyPeriod(corrected, '2025-11');
    const backToAugust = applyPeriod(toNovember, '2026-08');
    expect(backToAugust.find((transaction) => transaction.id === 'txn_005')?.category).toBe(
      'Transporte',
    );
  });
});
