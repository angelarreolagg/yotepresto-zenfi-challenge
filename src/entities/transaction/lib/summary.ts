import { getTransactionKind, isSpendEligible } from './eligibility';
import type { Transaction } from '../model/types';

export interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
}

/**
 * totalIncome/totalExpenses are positive magnitudes; netFlow is signed. Self-filters through
 * isSpendEligible so a caller can hand it any slice of transactions (a month, a week) without
 * pre-scrubbing it — used by both the monthly strip and the weekly navigator, which is exactly
 * why this can't apply the exclusions twice in two different ways.
 *
 * A refund nets for free here: it is 'gasto'-kind but amountMXN is positive, so subtracting it
 * from the running expense total is the netting — no separate "refunds" bucket exists.
 */
export function computeSummary(transactions: Transaction[]): Summary {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const transaction of transactions) {
    if (!isSpendEligible(transaction)) continue;

    const kind = getTransactionKind(transaction);
    if (kind === 'ingreso') totalIncome += transaction.metadata.amountMXN;
    else if (kind === 'gasto') totalExpenses -= transaction.metadata.amountMXN;
  }

  return { totalIncome, totalExpenses, netFlow: totalIncome - totalExpenses };
}
