import { useLocale } from '@/shared/i18n/useLocale';
import { cn } from '@/shared/lib/cn';
import { MINUS_SIGN, formatCurrency } from '@/shared/lib/format';

interface AmountProps {
  amountMXN: number;
  /** 'net' is the one place a negative reads red — everywhere else the sign already says it. */
  variant?: 'default' | 'net';
  className?: string;
}

/**
 * Expenses are the overwhelming majority of rows and render in primary white with a −; painting
 * them red would turn the whole list red and destroy the signal (STYLEGUIDE §3). Income is green
 * with a +, zero is muted, and `tabular-nums` keeps a column of these aligned.
 */
export function Amount({ amountMXN, variant = 'default', className }: AmountProps) {
  const { intlLocale } = useLocale();

  const sign = amountMXN < 0 ? MINUS_SIGN : amountMXN > 0 ? '+' : '';
  const colorClass =
    amountMXN === 0
      ? 'text-text-muted'
      : amountMXN > 0
        ? 'text-positive'
        : variant === 'net'
          ? 'text-negative'
          : 'text-text-primary';

  return (
    <span className={cn('tabular-nums', colorClass, className)}>
      {sign}
      {formatCurrency(amountMXN, intlLocale)}
    </span>
  );
}
