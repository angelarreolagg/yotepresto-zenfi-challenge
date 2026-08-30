import { afterEach, describe, expect, it } from 'vitest';

import { useTransactionStore } from './store';

const initialState = useTransactionStore.getState();

afterEach(() => {
  useTransactionStore.setState(initialState, true);
});

function byId(id: string) {
  const transaction = useTransactionStore.getState().transactions.find((t) => t.id === id);
  if (!transaction) throw new Error(`fixture missing: ${id}`);
  return transaction;
}

describe('useTransactionStore — bootstrap', () => {
  it('resolves to the file-declared period and lists all three available periods', () => {
    const state = useTransactionStore.getState();
    expect(state.selectedPeriod).toBe('2026-08');
    expect(state.availablePeriods).toEqual(['2025-11', '2026-08', '2026-09']);
  });

  it('scopes the initial transactions to the resolved period', () => {
    const state = useTransactionStore.getState();
    expect(state.transactions.filter((t) => !t.metadata.isOutOfPeriod)).toHaveLength(59);
  });
});

describe('updateCategory', () => {
  it('hits exactly one row and clears its uncategorized flag', () => {
    expect(byId('txn_016').metadata.isUncategorized).toBe(true);
    const others = useTransactionStore.getState().transactions.filter((t) => t.id !== 'txn_016');

    useTransactionStore.getState().updateCategory('txn_016', 'Suscripciones');

    const updated = byId('txn_016');
    expect(updated.category).toBe('Suscripciones');
    expect(updated.metadata.isUncategorized).toBe(false);

    // Every other row keeps the exact same object reference — only one row was touched.
    const othersAfter = useTransactionStore
      .getState()
      .transactions.filter((t) => t.id !== 'txn_016');
    others.forEach((transaction, index) => {
      expect(othersAfter[index]).toBe(transaction);
    });
  });

  it('records the correction in categoryOverrides', () => {
    useTransactionStore.getState().updateCategory('txn_005', 'Transporte');
    expect(useTransactionStore.getState().categoryOverrides.txn_005).toBe('Transporte');
  });

  it('survives a month change and back', () => {
    useTransactionStore.getState().updateCategory('txn_005', 'Transporte');
    useTransactionStore.getState().setPeriod('2025-11');
    useTransactionStore.getState().setPeriod('2026-08');
    expect(byId('txn_005').category).toBe('Transporte');
  });
});

describe('setPeriod', () => {
  it('ignores a period that does not exist', () => {
    const before = useTransactionStore.getState();
    useTransactionStore.getState().setPeriod('1999-01');
    expect(useTransactionStore.getState().selectedPeriod).toBe(before.selectedPeriod);
  });

  it('re-scopes isOutOfPeriod when switching to a real period', () => {
    useTransactionStore.getState().setPeriod('2025-11');
    expect(byId('txn_059').metadata.isOutOfPeriod).toBe(false);
    expect(byId('txn_001').metadata.isOutOfPeriod).toBe(true);
  });
});

describe('setUser / setLanguage', () => {
  it('ignores an unknown user id', () => {
    const before = useTransactionStore.getState().currentUser;
    useTransactionStore.getState().setUser('not-a-real-user');
    expect(useTransactionStore.getState().currentUser).toBe(before);
  });

  it('accepts a known user id', () => {
    useTransactionStore.getState().setUser('sofia');
    expect(useTransactionStore.getState().currentUser).toBe('sofia');
  });

  it('accepts a supported language', () => {
    useTransactionStore.getState().setLanguage('en');
    expect(useTransactionStore.getState().language).toBe('en');
  });
});

describe('resetToOriginal', () => {
  it('restores the original category and keeps the language the user picked', () => {
    useTransactionStore.getState().setLanguage('en');
    useTransactionStore.getState().updateCategory('txn_005', 'Transporte');

    useTransactionStore.getState().resetToOriginal();

    const state = useTransactionStore.getState();
    expect(state.categoryOverrides).toEqual({});
    expect(byId('txn_005').category).toBe('Salud');
    expect(state.language).toBe('en');
  });
});
