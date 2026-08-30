import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';

import type { TransactionMetadata } from '../model/types';

interface FlagBadgesProps {
  metadata: TransactionMetadata;
  className?: string;
}

/**
 * Short, visible text badges — never colour alone (STYLEGUIDE §10). This is the compact row-level
 * version; the edit modal's TransactionDetails carries the longer explanation of what each flag
 * actually did to the number.
 */
export function FlagBadges({ metadata, className }: FlagBadgesProps) {
  const { t } = useTranslation();

  const labels = [
    metadata.isDuplicate && t('transactionList.flags.duplicate'),
    metadata.isRefund && t('transactionList.flags.refund'),
    metadata.isForeignCurrency && t('transactionList.flags.foreignCurrency'),
    metadata.hadInferredSign && t('transactionList.flags.correctedAmount'),
    metadata.isZeroAmount && t('transactionList.flags.zeroAmount'),
  ].filter((label): label is string => Boolean(label));

  if (labels.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full bg-surface-raised px-2 py-0.5 text-[0.625rem] text-text-secondary"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
