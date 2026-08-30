import type { ReactNode } from 'react';

import { OnboardingOverlay } from '@/features/onboarding';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Where portaled, app-wide overlays mount. The onboarding tour lands here rather than inside any
 * one feature, since it anchors to elements across several of them (ROADMAP §5.4).
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      {children}
      <OnboardingOverlay />
    </>
  );
}
