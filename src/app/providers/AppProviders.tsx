import type { ReactNode } from 'react';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Where portaled, app-wide overlays mount — the onboarding tour lands here in ROADMAP §8 phase
 * 7, kept out of any one feature since it anchors to elements across several of them.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <>{children}</>;
}
