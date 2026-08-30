import { isSupportedLanguage, type Language } from '@/shared/i18n/languages';

import { UNCATEGORIZED, isKnownCategory, type Category } from './types';

/** Bumping this key, not migrating its shape, is the intended path past a breaking change. */
export const STORAGE_KEY = 'zenfi.decisions.v1';

/**
 * Everything a reload must survive — decisions only, never the normalized transaction array
 * itself (ROADMAP.md §4). `selectedPeriod` / `currentUser` are stored as their raw ids; whether
 * they still refer to something real is the store's problem once the dataset and profile list
 * are available (§5.6), not this module's — this module only proves the JSON is shaped right.
 */
export interface PersistedState {
  categoryOverrides: Record<string, Category>;
  selectedPeriod: string | null;
  currentUser: string | null;
  language: Language | null;
}

const DEFAULT_STATE: PersistedState = {
  categoryOverrides: {},
  selectedPeriod: null,
  currentUser: null,
  language: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** An id mapped to a category this build no longer knows is dropped, never coerced to a guess. */
function parseCategoryOverrides(value: unknown): Record<string, Category> {
  if (!isRecord(value)) return {};

  const overrides: Record<string, Category> = {};
  for (const [id, category] of Object.entries(value)) {
    if (typeof category !== 'string') continue;
    if (category !== UNCATEGORIZED && !isKnownCategory(category)) continue;
    overrides[id] = category;
  }
  return overrides;
}

function parseOptionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function parseLanguage(value: unknown): Language | null {
  return typeof value === 'string' && isSupportedLanguage(value) ? value : null;
}

/**
 * Pure and DOM-free so it is testable without mounting anything. Must survive corrupt JSON,
 * wrong field types, and enum values (categories, languages) that no longer exist in this build
 * — each bad field falls back to its own default rather than discarding the whole payload.
 */
export function parsePersistedState(stored: string | null): PersistedState {
  if (stored === null) return DEFAULT_STATE;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return DEFAULT_STATE;
  }

  if (!isRecord(parsed)) return DEFAULT_STATE;

  return {
    categoryOverrides: parseCategoryOverrides(parsed.categoryOverrides),
    selectedPeriod: parseOptionalString(parsed.selectedPeriod),
    currentUser: parseOptionalString(parsed.currentUser),
    language: parseLanguage(parsed.language),
  };
}
