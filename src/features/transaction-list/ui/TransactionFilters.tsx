import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  CategoryIcon,
  type Category,
  type Transaction,
  type TransactionKind,
} from '@/entities/transaction';
import { cn } from '@/shared/lib/cn';
import { Dropdown, type DropdownOption } from '@/shared/ui/Dropdown';

import {
  EMPTY_FILTERS,
  applyFilters,
  isFiltersActive,
  type TransactionFilters as Filters,
} from '../lib/filters';

const KINDS = ['gasto', 'ingreso', 'traspaso'] as const satisfies readonly TransactionKind[];

/**
 * The vendored Dropdown's `onChange` only ever hands back a `TValue` (never null), so "all" needs
 * its own sentinel option in the list rather than being representable as "nothing selected" —
 * otherwise, once a real value is picked, there is no option left that leads back to it. Chosen
 * to never collide with a real category/account/kind string.
 */
const ALL_VALUE = '__all__';

interface TransactionFiltersProps {
  /** The period's full row set (unfiltered) — result counts are computed against this. */
  transactions: Transaction[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}

/**
 * ROADMAP §6.5: a pill search field, and three dropdowns that collapse behind a toggle below
 * `sm` and sit in one row from it — one render, not two: `mobileFiltersOpen` only controls
 * `display` below `sm`, where `sm:flex` already forces the row visible regardless of it.
 */
export function TransactionFilters({ transactions, filters, onChange }: TransactionFiltersProps) {
  const { t } = useTranslation();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const allLabel = t('transactionList.filters.all');
  const allMeta = String(transactions.length);

  const kindOptions: DropdownOption<TransactionKind | typeof ALL_VALUE>[] = [
    { value: ALL_VALUE, label: allLabel, meta: allMeta },
    ...KINDS.map((kind) => ({
      value: kind,
      label: t(`transactionList.filters.kind.${kind}`),
      meta: String(applyFilters(transactions, { ...filters, kind }).length),
    })),
  ];

  const categoryOptions = useMemo<DropdownOption<Category | typeof ALL_VALUE>[]>(() => {
    const values = [...new Set(transactions.map((transaction) => transaction.category))].sort();
    return [
      { value: ALL_VALUE, label: allLabel, meta: allMeta },
      ...values.map((category) => ({
        value: category,
        label: category,
        icon: <CategoryIcon category={category} size="sm" />,
        meta: String(applyFilters(transactions, { ...filters, category }).length),
      })),
    ];
  }, [transactions, filters, allLabel, allMeta]);

  const accountOptions = useMemo<DropdownOption<string>[]>(() => {
    const values = [...new Set(transactions.map((transaction) => transaction.account))].sort();
    return [
      { value: ALL_VALUE, label: allLabel, meta: allMeta },
      ...values.map((account) => ({
        value: account,
        label: account === '' ? t('transactionList.row.noAccount') : account,
        meta: String(applyFilters(transactions, { ...filters, account }).length),
      })),
    ];
  }, [transactions, filters, allLabel, allMeta, t]);

  const activeDimensionCount =
    [filters.kind, filters.category, filters.account].filter((value) => value !== null).length +
    (filters.search.trim() !== '' ? 1 : 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder={t('transactionList.search.placeholder')}
            aria-label={t('transactionList.search.ariaLabel')}
            className="w-full rounded-full bg-surface-raised/70 py-2 pr-3.5 pl-9 text-sm text-text-primary backdrop-blur-md placeholder:text-text-secondary"
          />
        </div>

        <button
          type="button"
          onClick={() => setMobileFiltersOpen((value) => !value)}
          aria-expanded={mobileFiltersOpen}
          aria-label={t('transactionList.filters.toggle')}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised/70 text-text-secondary backdrop-blur-md transition-transform active:scale-90 sm:hidden"
        >
          <SlidersHorizontal size={16} />
          {activeDimensionCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[0.625rem] font-semibold text-white">
              {activeDimensionCount}
            </span>
          )}
        </button>

        {isFiltersActive(filters) && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="shrink-0 animate-reveal-inline overflow-hidden text-xs font-semibold whitespace-nowrap text-accent transition-transform active:scale-[0.97]"
          >
            {t('transactionList.filters.clear')}
          </button>
        )}
      </div>

      <div className={cn(mobileFiltersOpen ? 'grid grid-cols-2' : 'hidden', 'gap-2 sm:flex')}>
        <Dropdown
          label={t('transactionList.filters.kind.label')}
          value={filters.kind ?? ALL_VALUE}
          options={kindOptions}
          onChange={(value) => onChange({ ...filters, kind: value === ALL_VALUE ? null : value })}
          className="sm:min-w-0 sm:flex-1"
        />
        <Dropdown
          label={t('transactionList.filters.category.label')}
          value={filters.category ?? ALL_VALUE}
          options={categoryOptions}
          onChange={(value) =>
            onChange({ ...filters, category: value === ALL_VALUE ? null : value })
          }
          className="sm:min-w-0 sm:flex-1"
        />
        <Dropdown
          label={t('transactionList.filters.account.label')}
          value={filters.account ?? ALL_VALUE}
          options={accountOptions}
          onChange={(value) =>
            onChange({ ...filters, account: value === ALL_VALUE ? null : value })
          }
          className="col-span-2 sm:min-w-0 sm:flex-1"
        />
      </div>
    </div>
  );
}
