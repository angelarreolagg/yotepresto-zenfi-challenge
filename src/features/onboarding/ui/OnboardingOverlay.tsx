import { useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { useReducedMotion } from '@/shared/ui/useReducedMotion';

import { ONBOARDING_STEPS, useOnboardingStore } from '../model/onboardingStore';

const RING_PADDING_PX = 4;
const CARD_GAP_PX = 12;
const CARD_WIDTH_PX = 288;
const VIEWPORT_MARGIN_PX = 16;
/** Smooth scrollIntoView is frame-driven; a throttled or backgrounded tab can defer it well past
 * one frame, so the first measurement is backed by a short poll rather than trusted alone
 * (ROADMAP §6.7). */
const POLL_INTERVAL_MS = 100;
const POLL_DURATION_MS = 800;

interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measure(anchor: string): AnchorRect | null {
  const element = document.querySelector<HTMLElement>(`[data-onboarding="${anchor}"]`);
  if (element === null) return null;
  const rect = element.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

interface Placement {
  top: number | null;
  bottom: number | null;
  left: number;
}

/** Below the anchor, else above, else pinned to the bottom edge — the third branch is what the
 * analysis card needs on a phone, where it is taller than the viewport (ROADMAP §6.7). */
function computePlacement(rect: AnchorRect | null, cardHeight: number): Placement {
  if (rect === null) return { top: null, bottom: VIEWPORT_MARGIN_PX, left: VIEWPORT_MARGIN_PX };

  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const left = Math.min(
    Math.max(rect.left, VIEWPORT_MARGIN_PX),
    window.innerWidth - CARD_WIDTH_PX - VIEWPORT_MARGIN_PX,
  );

  if (spaceBelow >= cardHeight + CARD_GAP_PX) {
    return { top: rect.top + rect.height + CARD_GAP_PX, bottom: null, left };
  }
  if (spaceAbove >= cardHeight + CARD_GAP_PX) {
    return { top: rect.top - cardHeight - CARD_GAP_PX, bottom: null, left };
  }
  return { top: null, bottom: VIEWPORT_MARGIN_PX, left };
}

/**
 * Non-blocking (ROADMAP §6.7): the dim layer is `pointer-events: none`, so the dashboard stays
 * usable and the tour can never be something the user must dismiss first. Only the card itself
 * re-enables pointer events. `aria-modal="false"` on the card matches that (STYLEGUIDE §10).
 */
export function OnboardingOverlay() {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const active = useOnboardingStore((state) => state.active);
  const stepIndex = useOnboardingStore((state) => state.stepIndex);
  const advance = useOnboardingStore((state) => state.advance);
  const skip = useOnboardingStore((state) => state.skip);

  const cardRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<AnchorRect | null>(null);
  const [cardHeight, setCardHeight] = useState(160);

  const anchor = ONBOARDING_STEPS[stepIndex];

  useLayoutEffect(() => {
    if (!active || anchor === undefined) return undefined;

    const element = document.querySelector<HTMLElement>(`[data-onboarding="${anchor}"]`);
    element?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });

    const remeasure = () => setRect(measure(anchor));

    const frame = requestAnimationFrame(remeasure);
    const pollId = window.setInterval(remeasure, POLL_INTERVAL_MS);
    const pollTimeout = window.setTimeout(() => window.clearInterval(pollId), POLL_DURATION_MS);

    window.addEventListener('scroll', remeasure, { passive: true });
    window.addEventListener('resize', remeasure);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(pollId);
      window.clearTimeout(pollTimeout);
      window.removeEventListener('scroll', remeasure);
      window.removeEventListener('resize', remeasure);
    };
  }, [active, anchor, reducedMotion]);

  useLayoutEffect(() => {
    if (cardRef.current === null) return;
    setCardHeight(cardRef.current.getBoundingClientRect().height);
  }, [stepIndex, rect]);

  if (!active || anchor === undefined) return null;

  const placement = computePlacement(rect, cardHeight);
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 transition-opacity duration-200" />

      {rect !== null && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-accent transition-[top,left,width,height] duration-200"
          style={{
            top: rect.top - RING_PADDING_PX,
            left: rect.left - RING_PADDING_PX,
            width: rect.width + RING_PADDING_PX * 2,
            height: rect.height + RING_PADDING_PX * 2,
          }}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="onboarding-title"
        className={cn(
          'pointer-events-auto absolute flex animate-rise-in flex-col gap-2 rounded-2xl bg-surface-raised p-4 shadow-2xl',
        )}
        style={{
          width: CARD_WIDTH_PX,
          left: placement.left,
          top: placement.top ?? undefined,
          bottom: placement.bottom ?? undefined,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <p id="onboarding-title" className="text-sm font-bold">
            {t(`onboarding.${anchor}.title`)}
          </p>
          <button
            type="button"
            aria-label={t('onboarding.skip')}
            onClick={skip}
            className="-mt-1 -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-secondary"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-text-secondary">{t(`onboarding.${anchor}.body`)}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[0.6875rem] text-text-muted tabular-nums">
            {t('onboarding.progress', { current: stepIndex + 1, total: ONBOARDING_STEPS.length })}
          </span>
          <button
            type="button"
            onClick={advance}
            className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-transform active:scale-[0.97]"
          >
            {isLastStep ? t('onboarding.done') : t('onboarding.next')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
