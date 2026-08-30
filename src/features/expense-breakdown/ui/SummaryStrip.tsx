import { BanknoteArrowUp, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Amount } from '@/entities/transaction';

interface SummaryStripProps {
  totalIncome: number;
  netFlow: number;
}

/**
 * Expenses are deliberately absent: the headline figure above is already the largest thing on
 * screen, and repeating it here would dilute it (ROADMAP §6.3d). Icons are decorative reinforcement
 * only — the label text next to each is still what makes the figure accessible, not the glyph.
 */
export function SummaryStrip({ totalIncome, netFlow }: SummaryStripProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 divide-x divide-border border-t border-border pt-2.5 sm:pt-3">
      <div className="flex flex-col gap-0.5 pr-3">
        <span className="flex items-center gap-1 text-xs text-text-secondary">
          <BanknoteArrowUp size={13} aria-hidden />
          {t('expenseBreakdown.summary.income')}
        </span>
        <Amount amountMXN={totalIncome} className="text-sm font-semibold sm:text-base" />
      </div>
      <div className="flex flex-col gap-0.5 pl-3">
        <span className="flex items-center gap-1 text-xs text-text-secondary">
          <Scale size={13} aria-hidden />
          {t('expenseBreakdown.summary.net')}
        </span>
        <Amount amountMXN={netFlow} variant="net" className="text-sm font-semibold sm:text-base" />
      </div>
    </div>
  );
}
