/**
 * onboarding — the three-step first-run tour anchored to real elements, and the "help" restart.
 * Mounted in app/providers/AppProviders rather than inside a feature, since it anchors to
 * elements across several of them.
 * Depends on: @/shared/*
 */
export { OnboardingOverlay } from './ui/OnboardingOverlay';
export { useOnboardingStore } from './model/onboardingStore';
