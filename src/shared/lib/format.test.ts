import { describe, expect, it } from 'vitest';

import {
  MINUS_SIGN,
  formatCompactCurrency,
  formatCurrency,
  formatDateFromKey,
  formatForeignAmount,
  formatPercent,
} from './format';

describe('formatCurrency — narrowSymbol trap', () => {
  it('never renders MXN as MX$ in en-US', () => {
    expect(formatCurrency(79861.15, 'en-US')).not.toContain('MX$');
    expect(formatCurrency(79861.15, 'en-US')).toContain('$');
  });

  it('formats the same magnitude in es-MX', () => {
    expect(formatCurrency(-58211.15, 'es-MX')).toBe('$58,211.15');
  });

  it('is unsigned — sign is the caller (Amount.tsx)’s job, not the formatter’s', () => {
    expect(formatCurrency(-100, 'es-MX')).toBe(formatCurrency(100, 'es-MX'));
  });
});

describe('formatCompactCurrency — the decimal-split trick', () => {
  it('puts the symbol before the number in es-MX even though compact notation alone would not', () => {
    const { main, fraction } = formatCompactCurrency(79861.15, 'es-MX');
    expect(main).toBe('$79');
    expect(fraction.toLowerCase()).toBe('.9k');
  });

  it('agrees with es-MX in en-US (already symbol-first there)', () => {
    const { main, fraction } = formatCompactCurrency(79861.15, 'en-US');
    expect(main).toBe('$79');
    expect(fraction.toLowerCase()).toBe('.9k');
  });
});

describe('formatForeignAmount — the code trap', () => {
  it('uses the currency code, never a symbol, so it cannot be misread as MXN', () => {
    // Intl separates the code from the number with a non-breaking space (U+00A0), not U+0020.
    expect(formatForeignAmount(-12, 'USD', 'es-MX')).toBe('USD 12.00');
  });
});

describe('formatPercent', () => {
  it('formats a 0-1 fraction as a locale percentage', () => {
    expect(formatPercent(0.607, 'es-MX')).toBe('60.7%');
  });
});

describe('formatDateFromKey — the UTC trap', () => {
  it('renders the day in the data regardless of the runtime timezone', () => {
    // 2026-08-01 must read as the 1st, never the 31st of July, no matter where this test runs.
    expect(formatDateFromKey('2026-08-01', 'es-MX', { day: 'numeric', month: 'short' })).toContain(
      '1',
    );
  });
});

describe('MINUS_SIGN', () => {
  it('is U+2212, not a hyphen-minus', () => {
    expect(MINUS_SIGN).toBe('\u2212');
    expect(MINUS_SIGN).not.toBe('-');
  });
});
