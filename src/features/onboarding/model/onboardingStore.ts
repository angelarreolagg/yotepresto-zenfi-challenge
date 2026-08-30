import { create } from 'zustand';

import { safeStorage } from '@/shared/lib/safeStorage';

/**
 * The three real elements the tour anchors to (ROADMAP §6.7), in order. If only one survived a
 * cut it would be the edit button — nothing about a transaction row otherwise announces that its
 * category is editable, which is the entire reason this tour exists.
 */
export const ONBOARDING_STEPS = ['breakdown', 'edit-button', 'week-navigator'] as const;
export type OnboardingAnchor = (typeof ONBOARDING_STEPS)[number];

/** Versioned so a future redesign of the tour can invalidate everyone's "already seen" flag. */
export const ONBOARDING_SEEN_KEY = 'zenfi.onboarding.seen.v1';

interface OnboardingState {
  active: boolean;
  stepIndex: number;
  /** Used by the help button — restarts the tour without clearing the seen flag. */
  start: () => void;
  advance: () => void;
  skip: () => void;
}

function hasSeenOnboarding(): boolean {
  return safeStorage.get(ONBOARDING_SEEN_KEY) === 'true';
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  active: !hasSeenOnboarding(),
  stepIndex: 0,

  start: () => set({ active: true, stepIndex: 0 }),

  advance: () => {
    const { stepIndex } = get();
    if (stepIndex >= ONBOARDING_STEPS.length - 1) {
      safeStorage.set(ONBOARDING_SEEN_KEY, 'true');
      set({ active: false });
      return;
    }
    set({ stepIndex: stepIndex + 1 });
  },

  skip: () => {
    safeStorage.set(ONBOARDING_SEEN_KEY, 'true');
    set({ active: false });
  },
}));
