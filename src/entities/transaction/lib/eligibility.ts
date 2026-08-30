import { INCOME_CATEGORY, type Transaction } from '../model/types';

export type TransactionKind = 'gasto' | 'ingreso' | 'traspaso';

/**
 * Structural, not semantic: a refund is a positive amount inside an expense category, so it
 * still comes back 'gasto'. Calling it 'ingreso' would net it against nothing and inflate both
 * sides of the summary at once instead of just cancelling the expense it reverses.
 */
export function getTransactionKind(transaction: Transaction): TransactionKind {
  if (transaction.metadata.isTransfer) return 'traspaso';
  if (transaction.category === INCOME_CATEGORY) return 'ingreso';
  return 'gasto';
}

/**
 * The four §4 exclusions for "does this count as this month's spend": out-of-period, transfers,
 * en_disputa, and the second copy of a duplicate. `pendiente` and `programada` are deliberately
 * NOT here — inside the selected period, they count.
 */
export function isSpendEligible(transaction: Transaction): boolean {
  if (transaction.metadata.isOutOfPeriod) return false;
  if (transaction.metadata.isTransfer) return false;
  if (transaction.status === 'en_disputa') return false;
  if (transaction.metadata.isExtraDuplicate) return false;
  return true;
}
