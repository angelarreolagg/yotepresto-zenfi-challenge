import { useTranslation } from 'react-i18next';

import { Amount } from '@/entities/transaction';

interface SummaryStripProps {
  totalIncome: number;
  netFlow: number;
}

/**
 * Expenses are deliberately absent: the headline figure above is already the largest thing on
 * screen, and repeating it here would dilute it (ROADMAP §6.3d).
 */
export function SummaryStrip({ totalIncome, netFlow }: SummaryStripProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 divide-x divide-border border-t border-border pt-2.5 sm:pt-3">
      <div className="flex flex-col gap-0.5 pr-3">
        <span className="text-xs text-text-secondary">{t('expenseBreakdown.summary.income')}</span>
        <Amount amountMXN={totalIncome} className="text-sm font-semibold sm:text-base" />
      </div>
      <div className="flex flex-col gap-0.5 pl-3">
        <span className="text-xs text-text-secondary">{t('expenseBreakdown.summary.net')}</span>
        <Amount amountMXN={netFlow} variant="net" className="text-sm font-semibold sm:text-base" />
      </div>
    </div>
  );
}
