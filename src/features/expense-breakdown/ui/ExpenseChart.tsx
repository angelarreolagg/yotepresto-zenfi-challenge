import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { CATEGORY_COLORS, OTHERS_COLOR } from '@/entities/transaction';
import { useLocale } from '@/shared/i18n/useLocale';
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/shared/lib/format';

import type { ChartSlice } from '../lib/categoryBreakdown';

interface ExpenseChartProps {
  slices: ChartSlice[];
  totalExpenses: number;
}

interface SliceDatum {
  key: string;
  name: string;
  totalMXN: number;
  percentage: number;
  color: string;
}

function isSliceDatum(value: unknown): value is SliceDatum {
  return typeof value === 'object' && value !== null && 'percentage' in value && 'name' in value;
}

/**
 * Deliberately decoupled from Recharts' own (heavily generic) tooltip prop types: the inline
 * `content` render function below narrows whatever Recharts hands it through this guard, so this
 * component only ever deals with the shape it actually needs.
 */
function ChartTooltip({ datum, locale }: { datum: SliceDatum; locale: string }) {
  return (
    <div className="rounded-lg bg-surface-raised/70 px-3 py-2 text-xs shadow-2xl backdrop-blur-md">
      <p className="font-semibold text-text-primary">{datum.name}</p>
      <p className="tabular-nums text-text-primary">{formatCurrency(datum.totalMXN, locale)}</p>
      <p className="text-text-secondary">{formatPercent(datum.percentage / 100, locale)}</p>
    </div>
  );
}

/**
 * The wrapper is aria-hidden — CategoryBreakdownList below is the accessible version of the same
 * data (ROADMAP §6.3a). Tooltip is app-styled and pinned to the top so it can never collide with
 * the centre figure.
 */
export function ExpenseChart({ slices, totalExpenses }: ExpenseChartProps) {
  const { t } = useTranslation();
  const { intlLocale } = useLocale();

  const data = useMemo<SliceDatum[]>(
    () =>
      slices.map((slice) => ({
        key: slice.category ?? 'others',
        name: slice.category ?? t('expenseBreakdown.chart.others'),
        totalMXN: slice.totalMXN,
        percentage: slice.percentage,
        color: slice.category === null ? OTHERS_COLOR : CATEGORY_COLORS[slice.category],
      })),
    [slices, t],
  );

  const { main, fraction } = formatCompactCurrency(totalExpenses, intlLocale);

  return (
    <div className="relative h-40 animate-chart-in sm:h-60 lg:h-56" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="totalMXN"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            cornerRadius={4}
            stroke="none"
            // Recharts' own mount animation gets stuck at zero-angle in this build and never
            // advances (see index.css's chart-in keyframe for the full story) — always render
            // at final angles and let CSS handle the reveal instead.
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            position={{ y: 0 }}
            content={(props) => {
              const datum = props.payload?.[0]?.payload;
              if (props.active !== true || !isSliceDatum(datum)) return null;
              return <ChartTooltip datum={datum} locale={intlLocale} />;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-text-secondary">
          {t('expenseBreakdown.chart.totalLabel')}
        </span>
        <span className="text-[1.4rem] font-bold tracking-tight text-text-primary sm:text-[2.1rem] lg:text-[1.6rem]">
          {main}
          <span className="text-[0.6em]">{fraction}</span>
        </span>
      </div>
    </div>
  );
}
