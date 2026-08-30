import { describe, expect, it } from 'vitest';

import { STORAGE_KEY, parsePersistedState } from './persistence';

describe('parsePersistedState — untrusted input (CODESTYLE.md §8)', () => {
  it('uses the versioned storage key', () => {
    expect(STORAGE_KEY).toBe('zenfi.decisions.v1');
  });

  it('returns defaults for null (nothing ever persisted)', () => {
    expect(parsePersistedState(null)).toEqual({
      categoryOverrides: {},
      selectedPeriod: null,
      currentUser: null,
      language: null,
    });
  });

  it('returns defaults for corrupt JSON rather than throwing', () => {
    expect(() => parsePersistedState('{not: valid json')).not.toThrow();
    expect(parsePersistedState('{not: valid json')).toEqual({
      categoryOverrides: {},
      selectedPeriod: null,
      currentUser: null,
      language: null,
    });
  });

  it('returns defaults when the JSON parses but is not an object', () => {
    expect(parsePersistedState('[1,2,3]')).toEqual({
      categoryOverrides: {},
      selectedPeriod: null,
      currentUser: null,
      language: null,
    });
    expect(parsePersistedState('42')).toEqual({
      categoryOverrides: {},
      selectedPeriod: null,
      currentUser: null,
      language: null,
    });
  });

  it('keeps a category override that is still a known category', () => {
    const state = parsePersistedState(
      JSON.stringify({ categoryOverrides: { txn_005: 'Transporte' } }),
    );
    expect(state.categoryOverrides).toEqual({ txn_005: 'Transporte' });
  });

  it('drops, rather than coerces, an override pointing at a category that no longer exists', () => {
    const state = parsePersistedState(
      JSON.stringify({ categoryOverrides: { txn_005: 'Transporte', txn_009: 'CategoriaBorrada' } }),
    );
    expect(state.categoryOverrides).toEqual({ txn_005: 'Transporte' });
  });

  it('drops a non-string override value instead of coercing it', () => {
    const state = parsePersistedState(JSON.stringify({ categoryOverrides: { txn_005: 42 } }));
    expect(state.categoryOverrides).toEqual({});
  });

  it('ignores a categoryOverrides field of the wrong shape entirely', () => {
    const state = parsePersistedState(JSON.stringify({ categoryOverrides: 'not-an-object' }));
    expect(state.categoryOverrides).toEqual({});
  });

  it('falls back to null for a selectedPeriod / currentUser of the wrong type', () => {
    const state = parsePersistedState(
      JSON.stringify({ selectedPeriod: 20260801, currentUser: false }),
    );
    expect(state.selectedPeriod).toBeNull();
    expect(state.currentUser).toBeNull();
  });

  it('accepts a well-typed selectedPeriod / currentUser as-is', () => {
    const state = parsePersistedState(
      JSON.stringify({ selectedPeriod: '2026-08', currentUser: 'saul' }),
    );
    expect(state.selectedPeriod).toBe('2026-08');
    expect(state.currentUser).toBe('saul');
  });

  it('falls back to null for a language that no longer exists', () => {
    const state = parsePersistedState(JSON.stringify({ language: 'fr' }));
    expect(state.language).toBeNull();
  });

  it('accepts a supported language', () => {
    expect(parsePersistedState(JSON.stringify({ language: 'en' })).language).toBe('en');
  });
});
