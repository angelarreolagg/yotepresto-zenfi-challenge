import { describe, expect, it } from 'vitest';

import { useTransactionStore } from '@/entities/transaction';

import { computeTransactionNotes } from './transactionNotes';

const transactions = useTransactionStore.getState().transactions;

function get(id: string) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) throw new Error(`fixture missing: ${id}`);
  return transaction;
}

describe('computeTransactionNotes', () => {
  it('flags a duplicate', () => {
    expect(computeTransactionNotes(get('txn_021'))).toContainEqual({
      key: 'transactionList.details.duplicate',
    });
  });

  it('distinguishes pendiente from en_disputa', () => {
    expect(computeTransactionNotes(get('txn_053'))).toContainEqual({
      key: 'transactionList.details.pending',
    });
    expect(computeTransactionNotes(get('txn_061'))).toContainEqual({
      key: 'transactionList.details.disputed',
    });
  });

  it('carries both the native and converted amount for a foreign-currency row', () => {
    expect(computeTransactionNotes(get('txn_032'))).toContainEqual({
      key: 'transactionList.details.foreignCurrency',
      amount: -12,
      currency: 'USD',
      amountMXN: -222,
    });
  });

  it('flags a refund', () => {
    expect(computeTransactionNotes(get('txn_028'))).toContainEqual({
      key: 'transactionList.details.refund',
    });
  });

  it('flags a corrected sign', () => {
    expect(computeTransactionNotes(get('txn_024'))).toContainEqual({
      key: 'transactionList.details.correctedSign',
    });
  });

  it('returns no notes for a perfectly ordinary row', () => {
    expect(computeTransactionNotes(get('txn_002'))).toEqual([]);
  });
});
