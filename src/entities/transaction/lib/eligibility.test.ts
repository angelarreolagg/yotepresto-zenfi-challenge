import { describe, expect, it } from 'vitest';

import { rawDataset } from '../api/dataset';
import { normalizeAll } from '../model/normalize';
import { applyPeriod } from './periods';
import { getTransactionKind, isSpendEligible } from './eligibility';

const august = applyPeriod(normalizeAll(rawDataset.movimientos), '2026-08');
const byId = new Map(august.map((transaction) => [transaction.id, transaction]));

function get(id: string) {
  const transaction = byId.get(id);
  if (!transaction) throw new Error(`fixture missing: ${id}`);
  return transaction;
}

describe('getTransactionKind', () => {
  it('classifies an Ingresos row as ingreso', () => {
    expect(getTransactionKind(get('txn_001'))).toBe('ingreso');
  });

  it('classifies an ordinary expense as gasto', () => {
    expect(getTransactionKind(get('txn_002'))).toBe('gasto');
  });

  it('classifies a refund as gasto, not ingreso, so it nets instead of inflating both sides', () => {
    expect(getTransactionKind(get('txn_028'))).toBe('gasto');
  });

  it.each(['txn_010', 'txn_017', 'txn_020', 'txn_043'])(
    'classifies %s (a transfer) as traspaso',
    (id) => {
      expect(getTransactionKind(get(id))).toBe('traspaso');
    },
  );
});

describe('isSpendEligible', () => {
  it('excludes a row out of the selected period', () => {
    const outOfPeriod = applyPeriod(normalizeAll(rawDataset.movimientos), '2025-11').find(
      (transaction) => transaction.id === 'txn_060',
    );
    expect(outOfPeriod?.metadata.isOutOfPeriod).toBe(true);
    expect(outOfPeriod && isSpendEligible(outOfPeriod)).toBe(false);
  });

  it('excludes transfers', () => {
    expect(isSpendEligible(get('txn_010'))).toBe(false);
  });

  it('excludes en_disputa', () => {
    expect(get('txn_061').status).toBe('en_disputa');
    expect(isSpendEligible(get('txn_061'))).toBe(false);
  });

  it('includes pendiente and programada inside the period', () => {
    expect(get('txn_045').status).toBe('pendiente');
    // txn_045 is also the extra copy of a duplicate, so it is excluded for THAT reason — use an
    // independent pendiente row to prove pendiente alone does not exclude it.
    expect(get('txn_053').status).toBe('pendiente');
    expect(isSpendEligible(get('txn_053'))).toBe(true);
  });

  it('excludes only the second occurrence of a duplicate', () => {
    expect(isSpendEligible(get('txn_021'))).toBe(true);
    expect(isSpendEligible(get('txn_022'))).toBe(false);
    expect(isSpendEligible(get('txn_044'))).toBe(true);
    expect(isSpendEligible(get('txn_045'))).toBe(false);
  });

  it('includes a zero-amount row (it just contributes nothing)', () => {
    expect(isSpendEligible(get('txn_036'))).toBe(true);
  });
});
