/**
 * transaction — the shared domain: raw dataset normalization, business rules (eligibility,
 * summaries, periods), persisted decisions, and the store that ties them together.
 * Depends on: @/shared/*
 */
export { useTransactionStore } from './model/store';
export { STORAGE_KEY, parsePersistedState } from './model/persistence';
export {
  CATEGORIES,
  UNCATEGORIZED,
  isKnownCategory,
  type Category,
  type KnownCategory,
  type Transaction,
  type TransactionMetadata,
  type TransactionStatus,
} from './model/types';
export { computeSummary, type Summary } from './lib/summary';
export { getTransactionKind, isSpendEligible, type TransactionKind } from './lib/eligibility';
export { applyPeriod, listPeriods, scopeToPeriod } from './lib/periods';
