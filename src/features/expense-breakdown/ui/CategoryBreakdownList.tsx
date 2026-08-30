import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CATEGORY_COLORS, CategoryIcon } from '@/entities/transaction';
import { useLocale } from '@/shared/i18n/useLocale';
import { formatCurrency, formatPercent } from '@/shared/lib/format';

import type { CategoryBreakdownItem } from '../lib/categoryBreakdown';

const ALWAYS_VISIBLE_COUNT = 3;

function CategoryRow({ item }: { item: CategoryBreakdownItem }) {
  const { intlLocale } = useLocale();
  // Bars grow from 0 on mount: the flip happens inside a rAF, never synchronously in the effect
  // body, so this costs no extra render (CODESTYLE §6).
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <li className="flex items-center gap-2.5 sm:gap-3">
      <CategoryIcon category={item.category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium sm:text-base">{item.category}</span>
          <span className="shrink-0 text-sm font-semibold tabular-nums sm:text-base">
            {formatCurrency(item.totalMXN, intlLocale)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: grown ? `${item.percentage}%` : '0%',
                backgroundColor: CATEGORY_COLORS[item.category],
              }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs text-text-secondary">
            {formatPercent(item.percentage / 100, intlLocale)}
          </span>
        </div>
      </div>
    </li>
  );
}

interface CategoryBreakdownListProps {
  breakdown: CategoryBreakdownItem[];
}

/**
 * Every category, not just the charted ones — the chart's 5% grouping keeps the donut readable,
 * but applying it here too would mean the screen never says where a small slice of the money
 * went (ROADMAP §6.3c).
 */
export function CategoryBreakdownList({ breakdown }: CategoryBreakdownListProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const visible = breakdown.slice(0, ALWAYS_VISIBLE_COUNT);
  const rest = breakdown.slice(ALWAYS_VISIBLE_COUNT);

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      <ul className="flex flex-col gap-2.5 sm:gap-3">
        {visible.map((item) => (
          <CategoryRow key={item.category} item={item} />
        ))}
      </ul>

      {rest.length > 0 && (
        <>
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
          >
            <ul
              className="flex min-h-0 flex-col gap-2.5 overflow-hidden sm:gap-3"
              inert={!expanded}
            >
              {rest.map((item) => (
                <CategoryRow key={item.category} item={item} />
              ))}
            </ul>
          </div>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="self-start text-xs font-semibold text-accent"
          >
            {expanded ? t('expenseBreakdown.list.showLess') : t('expenseBreakdown.list.showMore')}
          </button>
        </>
      )}
    </div>
  );
}
