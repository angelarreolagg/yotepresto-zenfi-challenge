import type { Transaction } from '../model/types';

export function listPeriods(transactions: Transaction[]): string[] {
  return [...new Set(transactions.map((transaction) => transaction.periodKey))].sort();
}

/**
 * Re-scopes by flipping one flag rather than rebuilding from raw JSON, which would discard the
 * user's category corrections on every month switch. Returns the same array length, and the same
 * object reference for any record whose flag doesn't change, so React can skip re-rendering it.
 */
export function applyPeriod(transactions: Transaction[], period: string): Transaction[] {
  return transactions.map((transaction) => {
    const isOutOfPeriod = transaction.periodKey !== period;
    if (isOutOfPeriod === transaction.metadata.isOutOfPeriod) return transaction;

    return { ...transaction, metadata: { ...transaction.metadata, isOutOfPeriod } };
  });
}

/**
 * The list's row set for a period: every status and kind, transfers and disputes included — G2
 * needs to show what it excludes, not just what it counts. Filters directly on `periodKey` rather
 * than the `isOutOfPeriod` flag, so it works regardless of which period `applyPeriod` last ran.
 */
export function scopeToPeriod(transactions: Transaction[], period: string): Transaction[] {
  return transactions.filter((transaction) => transaction.periodKey === period);
}
