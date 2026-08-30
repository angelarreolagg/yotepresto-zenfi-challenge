import { Trans, useTranslation } from 'react-i18next';

import { useLocale } from '@/shared/i18n/useLocale';
import { formatCurrency, formatPercent } from '@/shared/lib/format';

import type { Insight } from '../lib/insight';

interface InsightLineProps {
  insight: Insight;
}

/**
 * Amounts are emphasised through `<Trans>`'s component map, not string concatenation, so the
 * markup lives in the catalogue and a translator can move the emphasis to wherever the figure
 * lands (CODESTYLE §2). The analysing/orb staging around this line lands in a later pass
 * (ROADMAP §8 phase 9) — this is the sentence itself, always live against the current breakdown.
 */
export function InsightLine({ insight }: InsightLineProps) {
  const { t } = useTranslation();
  const { intlLocale } = useLocale();

  if (insight.key === 'expenseBreakdown.insight.empty') {
    return <p className="text-xs text-text-secondary sm:text-sm">{t(insight.key)}</p>;
  }

  const values =
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
        };

  return (
    <p className="text-xs text-text-secondary sm:text-sm">
      <Trans
        i18nKey={insight.key}
        values={values}
        components={{ amount: <span className="font-semibold tabular-nums text-text-primary" /> }}
      />
    </p>
  );
}
