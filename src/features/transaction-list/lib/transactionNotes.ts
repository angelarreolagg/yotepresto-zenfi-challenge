import type { Transaction } from '@/entities/transaction';

/**
 * A translation key plus raw values, same discipline as expense-breakdown's insight.ts: lib/
 * cannot import i18n, so the sentence itself is built by the presentation layer. Every note says
 * what the flag did to the number, not just that it exists — "possible duplicate" alone is
 * trivia; the reason the total doesn't match a naive sum is what belongs here.
 */
export type TransactionNote =
  | { key: 'transactionList.details.uncategorized' }
  | { key: 'transactionList.details.duplicate' }
  | { key: 'transactionList.details.pending' }
  | { key: 'transactionList.details.disputed' }
  | {
      key: 'transactionList.details.foreignCurrency';
      amount: number;
      currency: string;
      amountMXN: number;
    }
  | { key: 'transactionList.details.refund' }
  | { key: 'transactionList.details.correctedSign' }
  | { key: 'transactionList.details.zeroAmount' };

export function computeTransactionNotes(transaction: Transaction): TransactionNote[] {
  const { metadata } = transaction;
  const notes: TransactionNote[] = [];

  if (metadata.isUncategorized) notes.push({ key: 'transactionList.details.uncategorized' });
  if (metadata.isDuplicate) notes.push({ key: 'transactionList.details.duplicate' });
  if (transaction.status === 'pendiente') notes.push({ key: 'transactionList.details.pending' });
  if (transaction.status === 'en_disputa') notes.push({ key: 'transactionList.details.disputed' });
  if (metadata.isForeignCurrency) {
    notes.push({
      key: 'transactionList.details.foreignCurrency',
      amount: transaction.amount,
      currency: transaction.currency,
      amountMXN: metadata.amountMXN,
    });
  }
  if (metadata.isRefund) notes.push({ key: 'transactionList.details.refund' });
  if (metadata.hadInferredSign) notes.push({ key: 'transactionList.details.correctedSign' });
  if (metadata.isZeroAmount) notes.push({ key: 'transactionList.details.zeroAmount' });

  return notes;
}
