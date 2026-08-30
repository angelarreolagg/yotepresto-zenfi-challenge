/**
 * Rounds to the nearest cent and collapses -0. Without it, float sums put
 * 79861.150000000001 on screen, and a value that lands on zero from the negative side reaches
 * the formatter as "−$0.00".
 */
export function toCents(amount: number): number {
  const cents = Math.round(amount * 100) / 100;
  return cents === 0 ? 0 : cents;
}
