import { describe, expect, it } from 'vitest';

import { useTransactionStore } from '@/entities/transaction';

import { EMPTY_FILTERS, applyFilters, isFiltersActive } from './filters';

const transactions = useTransactionStore.getState().transactions;

describe('applyFilters — the empty-filter identity case', () => {
  it('returns every transaction unchanged when nothing is set', () => {
    expect(applyFilters(transactions, EMPTY_FILTERS)).toEqual(transactions);
  });
});

describe('applyFilters — AND composition', () => {
  it('narrows by kind alone', () => {
    const result = applyFilters(transactions, { ...EMPTY_FILTERS, kind: 'traspaso' });
    expect(result.map((t) => t.id).sort()).toEqual(['txn_010', 'txn_017', 'txn_020', 'txn_043']);
  });

  it('narrows by category alone', () => {
    const result = applyFilters(transactions, { ...EMPTY_FILTERS, category: 'Sin categoría' });
    expect(result.map((t) => t.id).sort()).toEqual(['txn_016', 'txn_030', 'txn_049', 'txn_061']);
  });

  it('narrows by account alone', () => {
    const result = applyFilters(transactions, { ...EMPTY_FILTERS, account: '' });
    expect(result.map((t) => t.id)).toEqual(['txn_061']);
  });

  it('ANDs kind and category together, not ORs them', () => {
    const result = applyFilters(transactions, {
      ...EMPTY_FILTERS,
      kind: 'gasto',
      category: 'Salud',
    });
    expect(result.every((t) => t.category === 'Salud')).toBe(true);
    // txn_010 is a transfer, never 'gasto' — proving this isn't just the category filter alone.
    expect(result.some((t) => t.id === 'txn_010')).toBe(false);
  });
});

describe('applyFilters — search', () => {
  it('folds accents so café and cafe match the same rows', () => {
    const withAccent = applyFilters(transactions, { ...EMPTY_FILTERS, search: 'café' });
    const withoutAccent = applyFilters(transactions, { ...EMPTY_FILTERS, search: 'cafe' });
    expect(withAccent).toEqual(withoutAccent);
    expect(withAccent.some((t) => t.id === 'txn_025')).toBe(true);
  });

  it('matches every word in any order across description, category and account', () => {
    const forward = applyFilters(transactions, { ...EMPTY_FILTERS, search: 'oxxo canteras' });
    const reversed = applyFilters(transactions, { ...EMPTY_FILTERS, search: 'canteras oxxo' });
    expect(forward).toEqual(reversed);
    expect(forward.length).toBeGreaterThan(0);
  });

  it('matches a category name even when it is not in the description', () => {
    const result = applyFilters(transactions, { ...EMPTY_FILTERS, search: 'comida' });
    expect(result.every((t) => t.category === 'Comida')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    expect(applyFilters(transactions, { ...EMPTY_FILTERS, search: 'RAPPI' })).toEqual(
      applyFilters(transactions, { ...EMPTY_FILTERS, search: 'rappi' }),
    );
  });
});

describe('isFiltersActive', () => {
  it('is false only for the empty filters', () => {
    expect(isFiltersActive(EMPTY_FILTERS)).toBe(false);
    expect(isFiltersActive({ ...EMPTY_FILTERS, search: '   ' })).toBe(false);
  });

  it.each([
    { ...EMPTY_FILTERS, kind: 'gasto' as const },
    { ...EMPTY_FILTERS, category: 'Comida' as const },
    { ...EMPTY_FILTERS, account: 'Débito ****4821' },
    { ...EMPTY_FILTERS, search: 'oxxo' },
  ])('is true when any one dimension is set', (filters) => {
    expect(isFiltersActive(filters)).toBe(true);
  });
});
