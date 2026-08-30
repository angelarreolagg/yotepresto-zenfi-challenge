import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { useLocale } from '@/shared/i18n/useLocale';
import { formatCurrency, formatPercent } from '@/shared/lib/format';
import BorderGlow from '@/shared/ui/BorderGlow';
import { Orb } from '@/shared/ui/Orb';
import { useReducedMotion } from '@/shared/ui/useReducedMotion';

import type { Insight } from '../lib/insight';

/** Long enough to read as a conclusion being drawn, short enough not to read as lag — past
 * ~1.5s it stops feeling like thinking and starts feeling like a slow page (ROADMAP §6.4). */
const ANALYSING_MS = 1200;

/**
 * The insight card's bespoke palette (ROADMAP §6.4's exact spec for this one ornamental
 * element) — not reusable design tokens, so unlike everywhere else these are literal hex,
 * matching the sanctioned "feeds an inline-style prop" exception STYLEGUIDE §2 carves out for
 * the category series.
 */
const BORDER_GLOW_COLORS = ['#9160dc', '#7030cf', '#0a84ff'];

interface InsightLineProps {
  insight: Insight;
}

/**
 * The sequence (ROADMAP §6.4): for ANALYSING_MS the orb sits centred with its label; then the
 * sentence fades in, the orb travels to the left edge and settles across both lines, the label
 * fades out, and the border sweeps once. The re-run button re-plays this — a correction changes
 * the sentence silently otherwise, and the one moment that reads as *thinking* would only ever
 * happen on load.
 */
export function InsightLine({ insight }: InsightLineProps) {
  const { t } = useTranslation();
  const { intlLocale } = useLocale();
  const reducedMotion = useReducedMotion();

  const [timerElapsed, setTimerElapsed] = useState(false);
  const revealTimeoutRef = useRef<number | null>(null);
  const revealed = timerElapsed || reducedMotion;

  useEffect(() => {
    revealTimeoutRef.current = window.setTimeout(() => setTimerElapsed(true), ANALYSING_MS);
    return () => {
      if (revealTimeoutRef.current !== null) window.clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  const rerun = () => {
    if (revealTimeoutRef.current !== null) window.clearTimeout(revealTimeoutRef.current);
    setTimerElapsed(false);
    revealTimeoutRef.current = window.setTimeout(() => setTimerElapsed(true), ANALYSING_MS);
  };

  const sentence =
    insight.key === 'expenseBreakdown.insight.empty' ? (
      t(insight.key)
    ) : (
      <Trans
        i18nKey={insight.key}
        values={
          insight.key === 'expenseBreakdown.insight.topCategory'
            ? {
                category: insight.category,
                amount: formatCurrency(insight.amount, intlLocale),
                percentage: formatPercent(insight.percentage / 100, intlLocale),
              }
            : {
                fixedCategory: insight.fixedCategory,
                fixedPercentage: formatPercent(insight.fixedPercentage / 100, intlLocale),
                category: insight.category,
                amount: formatCurrency(insight.amount, intlLocale),
              }
        }
        components={{ amount: <span className="font-semibold tabular-nums text-text-primary" /> }}
      />
    );

  return (
    <BorderGlow
      animated={revealed && !reducedMotion}
      borderRadius={12}
      backgroundColor="var(--color-surface-sunken)"
      colors={BORDER_GLOW_COLORS}
      glowColor="265 62 67"
      glowRadius={22}
      glowIntensity={0.85}
      coneSpread={22}
      fillOpacity={0.45}
    >
      <div className="insight-body relative p-2.5 sm:p-3" data-revealed={revealed}>
        <p
          className="pr-7 pl-11 text-xs text-text-secondary transition-opacity duration-300 sm:pl-13 sm:text-sm"
          style={{ opacity: revealed ? 1 : 0 }}
        >
          {sentence}
        </p>
        <button
          type="button"
          aria-label={t('expenseBreakdown.insight.rerun')}
          onClick={rerun}
          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-text-secondary transition-transform active:scale-90"
        >
          <RotateCcw size={13} />
        </button>
        <div className="insight-orb">
          <Orb thinking={!revealed} />
          <span className="insight-orb__label">{t('expenseBreakdown.insight.analysing')}</span>
        </div>
      </div>
    </BorderGlow>
  );
}
