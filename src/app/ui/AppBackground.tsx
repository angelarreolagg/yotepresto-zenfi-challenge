import { Aurora } from '@/shared/ui/Aurora';
import { useReducedMotion } from '@/shared/ui/useReducedMotion';

/** Requested explicitly for this palette — not a reusable token, so literal hex like the Logo's
 * own brand colours. */
const COLOR_STOPS = ['#0096FC', '#151a41', '#5B0BE1'];

/**
 * Replaces the plain solid black with a subtle animated wash — a deliberate, explicitly
 * requested departure from STYLEGUIDE §1's "no animated background" rule. Kept subtle
 * (low opacity, moderate amplitude/blend) so §0's "legibility wins" still holds: every card sits
 * on a fully opaque bg-surface, so the aurora is only ever visible in the page's own negative
 * space, never behind text.
 *
 * Not rendered under prefers-reduced-motion: a continuously animated, colourful background is
 * exactly the kind of motion that preference exists to opt out of, and a frozen aurora isn't
 * really an aurora — falls back to the plain black background instead of a static snapshot.
 */
export function AppBackground() {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <Aurora
      colorStops={COLOR_STOPS}
      amplitude={1.0}
      blend={0.5}
      speed={0.6}
      className="pointer-events-none fixed inset-0 -z-10 opacity-60"
    />
  );
}
