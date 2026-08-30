import { computeSummary, type Summary, type Transaction } from '@/entities/transaction';

export interface WeekRange {
  startDateKey: string;
  endDateKey: string;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-');
  return new Date(Date.UTC(Number(year ?? 0), Number(month ?? 1) - 1, Number(day ?? 1)));
}

function toDateKey(date: Date): string {
  const iso = date.toISOString();
  return iso.slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** The Monday (UTC) of the ISO week containing this date. */
function isoWeekStart(date: Date): Date {
  const weekday = date.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  return addDays(date, diffToMonday);
}

function monthBounds(period: string): { start: Date; end: Date } {
  const [year, month] = period.split('-');
  const y = Number(year ?? 0);
  const m = Number(month ?? 1);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 0)) };
}

/**
 * ISO weeks (Monday start), clamped to the calendar month — a week straddling a month boundary
 * only shows the days that actually belong to this period. The list itself stops at the last
 * week that holds data rather than continuing to the end of the calendar month: with data
 * ending August 19th, generating trailing empty weeks through the 31st would give the `›`
 * button somewhere pointless to go. A gap *between* two populated weeks is kept, or the arrows
 * would jump unpredictably (ROADMAP §5.5).
 */
export function listWeeksInPeriod(transactions: Transaction[], period: string): WeekRange[] {
  const dateKeys = transactions
    .filter((transaction) => transaction.periodKey === period)
    .map((transaction) => transaction.dateKey)
    .sort();

  const firstDateKey = dateKeys[0];
  const lastDateKey = dateKeys[dateKeys.length - 1];
  if (firstDateKey === undefined || lastDateKey === undefined) return [];

  const { start: monthStart, end: monthEnd } = monthBounds(period);
  const lastDataDate = parseDateKey(lastDateKey);

  const weeks: WeekRange[] = [];
  let cursor = isoWeekStart(parseDateKey(firstDateKey));

  while (cursor <= lastDataDate) {
    const weekEnd = addDays(cursor, 6);
    const clampedStart = cursor < monthStart ? monthStart : cursor;
    const clampedEnd = weekEnd > monthEnd ? monthEnd : weekEnd;
    weeks.push({ startDateKey: toDateKey(clampedStart), endDateKey: toDateKey(clampedEnd) });
    cursor = addDays(cursor, 7);
  }

  return weeks;
}

export function scopeToWeek(transactions: Transaction[], week: WeekRange): Transaction[] {
  // dateKey is 'YYYY-MM-DD': lexicographic comparison is chronological comparison.
  return transactions.filter(
    (transaction) =>
      transaction.dateKey >= week.startDateKey && transaction.dateKey <= week.endDateKey,
  );
}

export function summarizeWeek(transactions: Transaction[], week: WeekRange): Summary {
  return computeSummary(scopeToWeek(transactions, week));
}
