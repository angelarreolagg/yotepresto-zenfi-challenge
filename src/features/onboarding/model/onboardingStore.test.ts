import { afterEach, describe, expect, it } from 'vitest';

import { ONBOARDING_STEPS, useOnboardingStore } from './onboardingStore';

// The full snapshot, actions included — setState(_, true) below *replaces* the whole state, so a
// partial object here would silently strip start/advance/skip from every later test.
const initialState = useOnboardingStore.getState();

afterEach(() => {
  useOnboardingStore.setState(initialState, true);
});

describe('useOnboardingStore', () => {
  it('advances through all three steps then deactivates', () => {
    expect(useOnboardingStore.getState().stepIndex).toBe(0);

    useOnboardingStore.getState().advance();
    expect(useOnboardingStore.getState().stepIndex).toBe(1);
    expect(useOnboardingStore.getState().active).toBe(true);

    useOnboardingStore.getState().advance();
    expect(useOnboardingStore.getState().stepIndex).toBe(2);

    useOnboardingStore.getState().advance();
    expect(useOnboardingStore.getState().active).toBe(false);
  });

  it('skip deactivates immediately, from any step', () => {
    useOnboardingStore.getState().advance();
    useOnboardingStore.getState().skip();
    expect(useOnboardingStore.getState().active).toBe(false);
  });

  it('start restarts from step 0', () => {
    useOnboardingStore.getState().advance();
    useOnboardingStore.getState().skip();

    useOnboardingStore.getState().start();
    expect(useOnboardingStore.getState().active).toBe(true);
    expect(useOnboardingStore.getState().stepIndex).toBe(0);
  });

  it('never throws even where localStorage is unavailable (this test environment)', () => {
    // Vitest's node environment has no `window` at all — the same "storage unavailable" case
    // ROADMAP §6.9 asks for, exercised for free rather than mocked (as in store.test.ts).
    expect(() => useOnboardingStore.getState().skip()).not.toThrow();
    expect(() => useOnboardingStore.getState().start()).not.toThrow();
  });

  it('has exactly the three documented anchors, in order', () => {
    expect(ONBOARDING_STEPS).toEqual(['breakdown', 'edit-button', 'week-navigator']);
  });
});
