/**
 * The 16 categories the aggregator actually assigns. 'Sin categoría' is a sentinel for a missing
 * one, not a 17th member of this union — a `Record<Category, ...>` (categoryTheme.ts) still has
 * to cover it, but nothing here ever assigns it as if the aggregator had sent it.
 */
export const CATEGORIES = [
  'Vivienda',
  'Supermercado',
  'Comida',
  'Transporte',
  'Compras',
  'Entretenimiento',
  'Salud',
  'Servicios',
  'Seguros',
  'Suscripciones',
  'Viajes',
  'Comisiones',
  'Ingresos',
  'Pagos',
  'Efectivo',
  'Transferencias',
] as const;

export type KnownCategory = (typeof CATEGORIES)[number];

export const UNCATEGORIZED = 'Sin categoría';

export type Category = KnownCategory | typeof UNCATEGORIZED;

/** Not spending: excluded from the month's totals and never colour-coded as if they were. */
export const TRANSFER_CATEGORIES = [
  'Pagos',
  'Efectivo',
  'Transferencias',
] as const satisfies readonly KnownCategory[];

export const INCOME_CATEGORY = 'Ingresos' satisfies KnownCategory;

export const STATUSES = ['confirmada', 'pendiente', 'programada', 'en_disputa'] as const;

export type TransactionStatus = (typeof STATUSES)[number];

export function isKnownCategory(value: string): value is KnownCategory {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function isTransactionStatus(value: string): value is TransactionStatus {
  return (STATUSES as readonly string[]).includes(value);
}

export function isTransferCategory(category: Category): boolean {
  return (TRANSFER_CATEGORIES as readonly Category[]).includes(category);
}

export interface TransactionMetadata {
  isUncategorized: boolean; // category was null or ''
  isDuplicate: boolean; // both copies get it
  isExtraDuplicate: boolean; // only the second; the only one excluded from totals
  isPendingOrDisputed: boolean;
  isOutOfPeriod: boolean; // flipped by applyPeriod, not by the record
  isForeignCurrency: boolean;
  isTransfer: boolean;
  isRefund: boolean; // positive amount inside an expense category
  isZeroAmount: boolean;
  hadInferredSign: boolean;
  amountMXN: number; // the ONLY figure any total may sum
}

export interface Transaction {
  id: string;
  description: string;
  date: Date; // ordering only, never display
  dateKey: string; // 'YYYY-MM-DD', read from the ISO string
  periodKey: string; // 'YYYY-MM', same source
  amount: number; // signed, in `currency`
  currency: string;
  category: Category;
  account: string; // '' when the aggregator sent none
  status: TransactionStatus;
  metadata: TransactionMetadata;
}
