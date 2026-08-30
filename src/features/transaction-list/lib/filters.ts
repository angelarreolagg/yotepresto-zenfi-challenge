import {
  getTransactionKind,
  type Category,
  type Transaction,
  type TransactionKind,
} from '@/entities/transaction';

export interface TransactionFilters {
  kind: TransactionKind | null;
  category: Category | null;
  account: string | null;
  search: string;
}

export const EMPTY_FILTERS: TransactionFilters = {
  kind: null,
  category: null,
  account: null,
  search: '',
};

/** NFD + strip combining marks, so "café" and "cafe" behave the same in search. */
function foldAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Every word must match in any order across description + category + account — this is what
 * makes "oxxo canteras" and "canteras oxxo" behave the same, and lets someone type "comida"
 * without knowing merchant names (ROADMAP §5.5).
 */
function matchesSearch(transaction: Transaction, search: string): boolean {
  const words = foldAccents(search.trim())
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length === 0) return true;

  const haystack = foldAccents(
    `${transaction.description} ${transaction.category} ${transaction.account}`,
  );
  return words.every((word) => haystack.includes(word));
}

/** ANDs kind + category + account + search; an unset dimension (null / '') matches everything. */
export function applyFilters(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  return transactions.filter((transaction) => {
    if (filters.kind !== null && getTransactionKind(transaction) !== filters.kind) return false;
    if (filters.category !== null && transaction.category !== filters.category) return false;
    if (filters.account !== null && transaction.account !== filters.account) return false;
    return matchesSearch(transaction, filters.search);
  });
}

export function isFiltersActive(filters: TransactionFilters): boolean {
  return (
    filters.kind !== null ||
    filters.category !== null ||
    filters.account !== null ||
    filters.search.trim() !== ''
  );
}
