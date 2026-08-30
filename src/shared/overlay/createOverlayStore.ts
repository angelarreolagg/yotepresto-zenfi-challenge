import { create } from 'zustand';

interface OverlayState<TPayload> {
  isOpen: boolean;
  payload: TPayload | null;
  triggerElement: HTMLElement | null;
  open: (payload: TPayload) => void;
  close: () => void;
}

/**
 * A tiny Zustand store per overlay, so a trigger buried deep in a list (a pencil button on one
 * row out of dozens) can open a modal rendered somewhere else entirely without prop-drilling
 * (ROADMAP §5.6). `open()` remembers whatever had focus when it was called and `close()` returns
 * focus to it — Esc closing an overlay without sending focus back to its trigger is the kind of
 * thing that reads as broken without ever throwing an error (STYLEGUIDE §10).
 */
export function createOverlayStore<TPayload = void>() {
  return create<OverlayState<TPayload>>((set, get) => ({
    isOpen: false,
    payload: null,
    triggerElement: null,
    open: (payload) => {
      const active = document.activeElement;
      set({ isOpen: true, payload, triggerElement: active instanceof HTMLElement ? active : null });
    },
    close: () => {
      const { triggerElement } = get();
      set({ isOpen: false, payload: null, triggerElement: null });
      triggerElement?.focus();
    },
  }));
}
