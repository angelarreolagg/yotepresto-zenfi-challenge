/**
 * Safe in any environment: returns null where `document` or `HTMLElement` don't exist at all
 * (this project's own Vitest environment has neither), rather than throwing a ReferenceError.
 * Used to capture "whatever had focus" so an overlay can restore it on close (STYLEGUIDE §10).
 */
export function getFocusedElement(): HTMLElement | null {
  if (typeof document === 'undefined' || typeof HTMLElement === 'undefined') return null;
  return document.activeElement instanceof HTMLElement ? document.activeElement : null;
}
