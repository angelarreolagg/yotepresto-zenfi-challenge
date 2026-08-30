import { describe, expect, it } from 'vitest';

import { rawDataset } from '../api/dataset';
import type { RawTransaction } from '../api/raw';
import { normalize, normalizeAll, withCategory, FX_USD_TO_MXN } from './normalize';
import { UNCATEGORIZED } from './types';

function findRaw(id: string): RawTransaction {
  const raw = rawDataset.movimientos.find((movimiento) => movimiento.id === id);
  if (!raw) throw new Error(`fixture missing from movimientos.json: ${id}`);
  return raw;
}

describe('normalize — one case per audited quirk (ROADMAP.md §2)', () => {
  it('txn_024: unsigned string amount on an expense category is negated and flagged', () => {
    const result = normalize(findRaw('txn_024'));
    expect(result.amount).toBe(-1876.4);
    expect(result.metadata.hadInferredSign).toBe(true);
  });

  it('txn_048: same string-amount trap, different record', () => {
    const result = normalize(findRaw('txn_048'));
    expect(result.amount).toBe(-2150);
    expect(result.metadata.hadInferredSign).toBe(true);
  });

  it('txn_016: null categoria falls back to the Sin categoría sentinel', () => {
    const result = normalize(findRaw('txn_016'));
    expect(result.category).toBe(UNCATEGORIZED);
    expect(result.metadata.isUncategorized).toBe(true);
  });

  it('txn_030: empty-string categoria is the same missing state as null, not a second one', () => {
    const result = normalize(findRaw('txn_030'));
    expect(result.category).toBe(UNCATEGORIZED);
    expect(result.metadata.isUncategorized).toBe(true);
  });

  it('txn_061: null cuenta becomes an empty string, never the literal "null"', () => {
    const result = normalize(findRaw('txn_061'));
    expect(result.account).toBe('');
  });

  it('txn_059: a row from November 2025 keys to its own period, not the file default', () => {
    const result = normalize(findRaw('txn_059'));
    expect(result.periodKey).toBe('2025-11');
  });

  it('txn_060: a row scheduled into September 2026 keys to that period', () => {
    const result = normalize(findRaw('txn_060'));
    expect(result.periodKey).toBe('2026-09');
    expect(result.status).toBe('programada');
    // programada is not pendiente/en_disputa — it gets no dimming flag of its own; the status
    // label on the row is what communicates it.
    expect(result.metadata.isPendingOrDisputed).toBe(false);
  });

  it('txn_045: pendiente is flagged as such', () => {
    const result = normalize(findRaw('txn_045'));
    expect(result.metadata.isPendingOrDisputed).toBe(true);
  });

  it('txn_061: en_disputa is flagged by the same metadata field as pendiente', () => {
    const result = normalize(findRaw('txn_061'));
    expect(result.status).toBe('en_disputa');
    expect(result.metadata.isPendingOrDisputed).toBe(true);
  });

  it('txn_032: a USD amount converts to MXN at the fixed rate but keeps its native amount/currency', () => {
    const result = normalize(findRaw('txn_032'));
    expect(result.currency).toBe('USD');
    expect(result.amount).toBe(-12);
    expect(result.metadata.isForeignCurrency).toBe(true);
    expect(result.metadata.amountMXN).toBeCloseTo(-12 * FX_USD_TO_MXN, 5);
  });

  it('txn_036: a zero-amount row is flagged and contributes nothing either way', () => {
    const result = normalize(findRaw('txn_036'));
    expect(result.metadata.isZeroAmount).toBe(true);
    expect(result.metadata.amountMXN).toBe(0);
  });

  it('txn_028: a positive refund inside an expense category is flagged, not booked as income', () => {
    const result = normalize(findRaw('txn_028'));
    expect(result.category).toBe('Compras');
    expect(result.amount).toBeGreaterThan(0);
    expect(result.metadata.isRefund).toBe(true);
  });

  it('txn_057: a positive amount inside Ingresos is ordinary income, not a refund', () => {
    const result = normalize(findRaw('txn_057'));
    expect(result.category).toBe('Ingresos');
    expect(result.metadata.isRefund).toBe(false);
  });

  it.each(['txn_010', 'txn_017', 'txn_020', 'txn_043'])(
    '%s: a transfer/cash-movement category is flagged so it never reads as spend',
    (id) => {
      const result = normalize(findRaw(id));
      expect(result.metadata.isTransfer).toBe(true);
    },
  );

  it('txn_025: accents and emoji pass through the description untouched', () => {
    const result = normalize(findRaw('txn_025'));
    expect(result.description).toBe('CAFÉ BRÚJULA — ALCALÁ ☕');
  });

  it('does not silently fix the seeded miscategorizations — that is what G2 is for', () => {
    expect(normalize(findRaw('txn_005')).category).toBe('Salud');
    expect(normalize(findRaw('txn_009')).category).toBe('Entretenimiento');
  });
});

describe('normalizeAll — whole-array duplicate resolution', () => {
  const transactions = normalizeAll(rawDataset.movimientos);
  const byId = new Map(transactions.map((transaction) => [transaction.id, transaction]));

  it('produces one Transaction per raw record', () => {
    expect(transactions).toHaveLength(rawDataset.movimientos.length);
  });

  it('txn_021/txn_022: an exact duplicate pair is both flagged, only the second excluded', () => {
    expect(byId.get('txn_021')?.metadata.isDuplicate).toBe(true);
    expect(byId.get('txn_021')?.metadata.isExtraDuplicate).toBe(false);
    expect(byId.get('txn_022')?.metadata.isDuplicate).toBe(true);
    expect(byId.get('txn_022')?.metadata.isExtraDuplicate).toBe(true);
  });

  it('txn_044/txn_045: the same rule catches a pending/confirmed pair too', () => {
    expect(byId.get('txn_044')?.metadata.isExtraDuplicate).toBe(false);
    expect(byId.get('txn_045')?.metadata.isExtraDuplicate).toBe(true);
  });

  it('an ordinary row with no collision is never flagged as a duplicate', () => {
    expect(byId.get('txn_001')?.metadata.isDuplicate).toBe(false);
  });
});

describe('withCategory', () => {
  it('returns the same reference when the category does not change', () => {
    const transaction = normalize(findRaw('txn_002'));
    expect(withCategory(transaction, transaction.category)).toBe(transaction);
  });

  it('correcting an uncategorized row clears isUncategorized', () => {
    const transaction = normalize(findRaw('txn_016'));
    const corrected = withCategory(transaction, 'Suscripciones');
    expect(corrected.category).toBe('Suscripciones');
    expect(corrected.metadata.isUncategorized).toBe(false);
    expect(corrected).not.toBe(transaction);
  });

  it('recategorizing into a transfer category flips isTransfer', () => {
    const transaction = normalize(findRaw('txn_002'));
    const corrected = withCategory(transaction, 'Efectivo');
    expect(corrected.metadata.isTransfer).toBe(true);
  });
});
