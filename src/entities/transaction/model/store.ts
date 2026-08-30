import { create } from 'zustand';

import { DEFAULT_USER_ID, findUser } from '@/shared/config/users';
import { DEFAULT_LANGUAGE, type Language } from '@/shared/i18n/languages';
import { safeStorage } from '@/shared/lib/safeStorage';

import { rawDataset } from '../api/dataset';
import { applyPeriod, listPeriods } from '../lib/periods';
import { normalizeAll, withCategory } from './normalize';
import { parsePersistedState, STORAGE_KEY, type PersistedState } from './persistence';
import type { Category, Transaction } from './types';

interface TransactionState {
  transactions: Transaction[];
  availablePeriods: string[];
  selectedPeriod: string;
  currentUser: string;
  language: Language;
  categoryOverrides: Record<string, Category>;
  updateCategory: (id: string, category: Category) => void;
  setPeriod: (period: string) => void;
  setUser: (userId: string) => void;
  setLanguage: (language: Language) => void;
  resetToOriginal: () => void;
}

function applyOverrides(
  transactions: Transaction[],
  overrides: Record<string, Category>,
): Transaction[] {
  if (Object.keys(overrides).length === 0) return transactions;

  return transactions.map((transaction) => {
    const category = overrides[transaction.id];
    return category === undefined ? transaction : withCategory(transaction, category);
  });
}

function persist(decisions: {
  categoryOverrides: Record<string, Category>;
  selectedPeriod: string;
  currentUser: string;
  language: Language;
}): void {
  const payload: PersistedState = decisions;
  safeStorage.set(STORAGE_KEY, JSON.stringify(payload));
}

const baseTransactions = normalizeAll(rawDataset.movimientos);
const availablePeriods = listPeriods(baseTransactions);
const persisted = parsePersistedState(safeStorage.get(STORAGE_KEY));

/** Falls back to the file's own declared period rather than leaving the screen empty. */
function resolvePeriod(candidate: string | null): string {
  if (candidate !== null && availablePeriods.includes(candidate)) return candidate;
  if (availablePeriods.includes(rawDataset.periodo)) return rawDataset.periodo;
  return availablePeriods[0] ?? rawDataset.periodo;
}

function resolveUser(candidate: string | null): string {
  return candidate !== null && findUser(candidate) !== undefined ? candidate : DEFAULT_USER_ID;
}

const initialPeriod = resolvePeriod(persisted.selectedPeriod);
const initialUser = resolveUser(persisted.currentUser);
const initialLanguage = persisted.language ?? DEFAULT_LANGUAGE;
const initialTransactions = applyPeriod(
  applyOverrides(baseTransactions, persisted.categoryOverrides),
  initialPeriod,
);

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: initialTransactions,
  availablePeriods,
  selectedPeriod: initialPeriod,
  currentUser: initialUser,
  language: initialLanguage,
  categoryOverrides: persisted.categoryOverrides,

  updateCategory: (id, category) =>
    set((state) => {
      const transactions = state.transactions.map((transaction) =>
        transaction.id === id ? withCategory(transaction, category) : transaction,
      );
      const categoryOverrides = { ...state.categoryOverrides, [id]: category };
      persist({ ...state, categoryOverrides });
      return { transactions, categoryOverrides };
    }),

  setPeriod: (period) =>
    set((state) => {
      if (!state.availablePeriods.includes(period)) return state;
      const transactions = applyPeriod(state.transactions, period);
      persist({ ...state, selectedPeriod: period });
      return { transactions, selectedPeriod: period };
    }),

  setUser: (userId) =>
    set((state) => {
      if (findUser(userId) === undefined) return state;
      persist({ ...state, currentUser: userId });
      return { currentUser: userId };
    }),

  setLanguage: (language) =>
    set((state) => {
      persist({ ...state, language });
      return { language };
    }),

  // Deliberately keeps language, selectedPeriod and currentUser: "restablecer los cambios" means
  // undoing category corrections, not resetting navigation the person set up on purpose.
  resetToOriginal: () =>
    set((state) => {
      const transactions = applyPeriod(normalizeAll(rawDataset.movimientos), state.selectedPeriod);
      const categoryOverrides = {};
      persist({ ...state, categoryOverrides });
      return { transactions, categoryOverrides };
    }),
}));
