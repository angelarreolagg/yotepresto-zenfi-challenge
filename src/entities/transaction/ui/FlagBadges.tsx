import { CircleSlash2, Copy, Globe, Undo2, Wrench } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';

import type { TransactionMetadata } from '../model/types';

interface FlagBadgesProps {
  metadata: TransactionMetadata;
  className?: string;
}

/**
 * Short, visible text badges — never colour alone (STYLEGUIDE §10). The icon is reinforcement,
 * not the accessible channel: the label text is what makes each badge legible without it. This
 * is the compact row-level version; the edit modal's TransactionDetails carries the longer
 * explanation of what each flag actually did to the number.
 */
export function FlagBadges({ metadata, className }: FlagBadgesProps) {
  const { t } = useTranslation();

  const badges = [
    metadata.isDuplicate && {
      icon: <Copy size={11} aria-hidden />,
      label: t('transactionList.flags.duplicate'),
    },
    metadata.isRefund && {
      icon: <Undo2 size={11} aria-hidden />,
      label: t('transactionList.flags.refund'),
    },
    metadata.isForeignCurrency && {
      icon: <Globe size={11} aria-hidden />,
      label: t('transactionList.flags.foreignCurrency'),
    },
    metadata.hadInferredSign && {
      icon: <Wrench size={11} aria-hidden />,
      label: t('transactionList.flags.correctedAmount'),
    },
    metadata.isZeroAmount && {
      icon: <CircleSlash2 size={11} aria-hidden />,
      label: t('transactionList.flags.zeroAmount'),
    },
  ].filter((badge): badge is { icon: ReactElement; label: string } => Boolean(badge));

  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {badges.map((badge) => (
        <span
          key={badge.label}
          className="flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-[0.625rem] text-text-secondary"
        >
          {badge.icon}
          {badge.label}
        </span>
      ))}
    </div>
  );
}
