import { create } from 'zustand';

import { getFocusedElement } from '@/shared/lib/activeElement';
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
  /** Whatever had focus when `start()` was called — usually the help button — so ending the
   * tour can return focus to it, same as any other overlay (STYLEGUIDE §10). Null for the
   * auto-started first-run tour, which has no trigger to return to. */
  triggerElement: HTMLElement | null;
  /** Used by the help button — restarts the tour without clearing the seen flag. */
  start: () => void;
  advance: () => void;
  skip: () => void;
}

function hasSeenOnboarding(): boolean {
  return safeStorage.get(ONBOARDING_SEEN_KEY) === 'true';
}

function restoreFocus(triggerElement: HTMLElement | null): void {
  triggerElement?.focus();
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  active: !hasSeenOnboarding(),
  stepIndex: 0,
  triggerElement: null,

  start: () => {
    set({ active: true, stepIndex: 0, triggerElement: getFocusedElement() });
  },

  advance: () => {
    const { stepIndex, triggerElement } = get();
    if (stepIndex >= ONBOARDING_STEPS.length - 1) {
      safeStorage.set(ONBOARDING_SEEN_KEY, 'true');
      set({ active: false, triggerElement: null });
      restoreFocus(triggerElement);
      return;
    }
    set({ stepIndex: stepIndex + 1 });
  },

  skip: () => {
    const { triggerElement } = get();
    safeStorage.set(ONBOARDING_SEEN_KEY, 'true');
    set({ active: false, triggerElement: null });
    restoreFocus(triggerElement);
  },
}));
