import { toCents } from './money';

/** Aligns with the digits — a hyphen-minus does not (STYLEGUIDE §3). */
export const MINUS_SIGN = '\u2212';

const CURRENCY = 'MXN';

function currencyFormatter(
  locale: string,
  options: Intl.NumberFormatOptions = {},
): Intl.NumberFormat {
  // narrowSymbol everywhere: en-US otherwise renders MXN as "MX$", which doesn't fit inside the
  // donut and spells the same figure two ways depending on interface language.
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: CURRENCY,
    currencyDisplay: 'narrowSymbol',
    ...options,
  });
}

/** Currency stays MXN in every language — it's the data, not a preference (CODESTYLE §2). */
export function formatCurrency(amountMXN: number, locale: string): string {
  return currencyFormatter(locale).format(toCents(Math.abs(amountMXN)));
}

export interface CompactCurrencyParts {
  main: string;
  fraction: string;
}

/**
 * The donut headline's decimal trick (STYLEGUIDE §3): returns the integer part and the
 * fraction+compact-suffix separately so the caller can render the fraction at a smaller size.
 *
 * Built from formatToParts rather than the formatted string, because `notation: 'compact'` puts
 * the currency symbol AFTER the suffix in es-MX ("79.9 k$") but before it in en-US ("$79.9K") —
 * reassembling from typed parts sidesteps parsing either shape back apart.
 */
export function formatCompactCurrency(amountMXN: number, locale: string): CompactCurrencyParts {
  const parts = currencyFormatter(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).formatToParts(toCents(Math.abs(amountMXN)));

  const take = (types: Array<Intl.NumberFormatPartTypes>) =>
    parts
      .filter((part) => types.includes(part.type))
      .map((part) => part.value)
      .join('');

  // es-MX orders compact currency parts as [integer, fraction, compact, currency] — symbol last
  // ("79.9 k$"). en-US already puts it first ("$79.9K"). The symbol is placed explicitly rather
  // than kept in whatever order Intl gave it, so both locales render "$79" / ".9k" the same way.
  const currency = parts.find((part) => part.type === 'currency')?.value ?? '';
  const main = `${currency}${take(['integer', 'group'])}`;
  const fraction = take(['decimal', 'fraction', 'compact']);

  return { main, fraction };
}

/**
 * The one place a foreign amount appears: `currencyDisplay: 'code'` so "USD 12.00" can't be
 * misread as MXN the way "$12.00 converted to $222.00" could.
 */
export function formatForeignAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(Math.abs(amount));
}

export function formatPercent(fraction: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(
    fraction,
  );
}

/**
 * Builds the date at UTC midnight from the calendar key and formats in UTC, so the rendered day
 * is the one in the data regardless of the viewer's timezone — never `new Date(dateKey)` parsed
 * and shown in local time.
 */
export function formatDateFromKey(
  dateKey: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const [year, month, day] = dateKey.split('-');
  const date = new Date(Date.UTC(Number(year ?? 0), Number(month ?? 1) - 1, Number(day ?? 1)));
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
}

/** 'YYYY-MM' → a locale month name + year, e.g. "agosto de 2026" / "August 2026". */
export function formatPeriodLabel(periodKey: string, locale: string): string {
  const [year, month] = periodKey.split('-');
  const date = new Date(Date.UTC(Number(year ?? 0), Number(month ?? 1) - 1, 1));
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
