import { describe, expect, it } from 'vitest';

import { createOverlayStore } from './createOverlayStore';

describe('createOverlayStore', () => {
  it('starts closed with no payload', () => {
    const useOverlay = createOverlayStore<{ id: string }>();
    expect(useOverlay.getState()).toMatchObject({ isOpen: false, payload: null });
  });

  it('open carries the payload through, close clears it', () => {
    const useOverlay = createOverlayStore<{ id: string }>();
    useOverlay.getState().open({ id: 'txn_001' });
    expect(useOverlay.getState()).toMatchObject({ isOpen: true, payload: { id: 'txn_001' } });

    useOverlay.getState().close();
    expect(useOverlay.getState()).toMatchObject({ isOpen: false, payload: null });
  });

  it('never throws even where document is unavailable (this test environment)', () => {
    // Vitest's node environment has no `document` — the same shape of gap safeStorage guards
    // against for `window`. open() reads document.activeElement to capture a trigger to focus
    // later; it must degrade to "no trigger" here, not crash.
    const useOverlay = createOverlayStore<void>();
    expect(() => useOverlay.getState().open()).not.toThrow();
    expect(useOverlay.getState().triggerElement).toBeNull();
    expect(() => useOverlay.getState().close()).not.toThrow();
  });
});
