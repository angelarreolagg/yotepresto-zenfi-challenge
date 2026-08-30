import type { RawTransaction } from '../api/raw';
import {
  INCOME_CATEGORY,
  UNCATEGORIZED,
  isKnownCategory,
  isTransactionStatus,
  isTransferCategory,
  type Category,
  type Transaction,
  type TransactionStatus,
} from './types';

/** The one fixed conversion rate. Never sum a foreign-currency amount unconverted. */
export const FX_USD_TO_MXN = 18.5;

const DATE_KEY_PATTERN = /^(\d{4}-\d{2}-\d{2})/;
const PERIOD_KEY_PATTERN = /^(\d{4}-\d{2})/;

/**
 * Reads the calendar date from the ISO string instead of Date's local getters: the latter shifts
 * across midnight when the viewer's timezone differs from the -06:00 offset in the data.
 */
function dateKeyFrom(iso: string): string {
  const [, key] = DATE_KEY_PATTERN.exec(iso) ?? [];
  return key ?? '';
}

function periodKeyFrom(iso: string): string {
  const [, key] = PERIOD_KEY_PATTERN.exec(iso) ?? [];
  return key ?? '';
}

function resolveCategory(raw: string | null): { category: Category; isUncategorized: boolean } {
  if (raw === null || raw === '') return { category: UNCATEGORIZED, isUncategorized: true };

  // Defensive, not spec'd: a category value outside the known 16. Never observed in
  // movimientos.json, but a value this doesn't recognize is treated like a missing one rather
  // than fabricating a 17th category or crashing on it.
  if (!isKnownCategory(raw)) return { category: UNCATEGORIZED, isUncategorized: true };

  return { category: raw, isUncategorized: false };
}

/** Unsigned string amounts are expenses unless the category is Ingresos (ROADMAP.md §4). */
function resolveAmount(
  raw: RawTransaction,
  category: Category,
): { amount: number; hadInferredSign: boolean } {
  if (typeof raw.monto === 'number') return { amount: raw.monto, hadInferredSign: false };

  const parsed = parseFloat(raw.monto);
  if (parsed > 0 && category !== INCOME_CATEGORY) return { amount: -parsed, hadInferredSign: true };

  return { amount: parsed, hadInferredSign: false };
}

function resolveStatus(raw: string): TransactionStatus {
  if (isTransactionStatus(raw)) return raw;
  // Not a graceful-fallback case like category: an unrecognized status means the aggregator's
  // export shape changed in a way nothing downstream is designed to handle.
  throw new Error(`Unknown transaction status: "${raw}"`);
}

/**
 * Per-record transform only. Duplicate detection needs the whole array, so `isDuplicate` /
 * `isExtraDuplicate` default to false here and `normalizeAll` resolves them in a second pass.
 * `isOutOfPeriod` likewise defaults to false: it is flipped by `applyPeriod` against whichever
 * period is selected, not decided by the record itself.
 */
export function normalize(raw: RawTransaction): Transaction {
  const { category, isUncategorized } = resolveCategory(raw.categoria);
  const { amount, hadInferredSign } = resolveAmount(raw, category);
  const isForeignCurrency = raw.moneda !== 'MXN';
  const amountMXN = isForeignCurrency ? amount * FX_USD_TO_MXN : amount;
  const isTransfer = isTransferCategory(category);
  const isRefund = !isTransfer && category !== INCOME_CATEGORY && amount > 0;
  const status = resolveStatus(raw.estado);

  return {
    id: raw.id,
    description: raw.descripcion,
    date: new Date(raw.fecha),
    dateKey: dateKeyFrom(raw.fecha),
    periodKey: periodKeyFrom(raw.fecha),
    amount,
    currency: raw.moneda,
    category,
    account: raw.cuenta ?? '',
    status,
    metadata: {
      isUncategorized,
      isDuplicate: false,
      isExtraDuplicate: false,
      isPendingOrDisputed: status === 'pendiente' || status === 'en_disputa',
      isOutOfPeriod: false,
      isForeignCurrency,
      isTransfer,
      isRefund,
      isZeroAmount: amount === 0,
      hadInferredSign,
      amountMXN,
    },
  };
}

function duplicateKey(transaction: Transaction): string {
  return `${transaction.description}|${transaction.amount}|${transaction.date.getTime()}`;
}

/**
 * Two records collide on description + amount + exact timestamp. All copies get `isDuplicate`;
 * only the second (by original array order) also gets `isExtraDuplicate`, the one totals exclude.
 */
export function normalizeAll(raws: RawTransaction[]): Transaction[] {
  const transactions = raws.map(normalize);

  const groups = new Map<string, number[]>();
  transactions.forEach((transaction, index) => {
    const key = duplicateKey(transaction);
    const indices = groups.get(key) ?? [];
    indices.push(index);
    groups.set(key, indices);
  });

  const isExtraDuplicateByIndex = new Map<number, boolean>();
  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    indices.forEach((transactionIndex, position) => {
      isExtraDuplicateByIndex.set(transactionIndex, position > 0);
    });
  }

  return transactions.map((transaction, index) => {
    const isExtraDuplicate = isExtraDuplicateByIndex.get(index);
    if (isExtraDuplicate === undefined) return transaction;

    return {
      ...transaction,
      metadata: { ...transaction.metadata, isDuplicate: true, isExtraDuplicate },
    };
  });
}

/**
 * Applies a category correction. Recomputes exactly the three flags that depend on category —
 * isUncategorized, isTransfer, isRefund — and returns the same object when nothing changed, so a
 * no-op correction can't break reference-equality checks upstream.
 */
export function withCategory(transaction: Transaction, category: Category): Transaction {
  if (transaction.category === category) return transaction;

  const isTransfer = isTransferCategory(category);

  return {
    ...transaction,
    category,
    metadata: {
      ...transaction.metadata,
      isUncategorized: category === UNCATEGORIZED,
      isTransfer,
      isRefund: !isTransfer && category !== INCOME_CATEGORY && transaction.amount > 0,
    },
  };
}
