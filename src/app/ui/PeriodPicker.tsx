import { useTranslation } from 'react-i18next';

import { useTransactionStore } from '@/entities/transaction';
import { useLocale } from '@/shared/i18n/useLocale';
import { formatPeriodLabel } from '@/shared/lib/format';
import { Dropdown, type DropdownOption } from '@/shared/ui/Dropdown';

/**
 * A title-variant dropdown with an uppercase label above it from `sm` only — the bar is
 * permanently on screen and "agosto de 2026" needs no label to be understood (ROADMAP §6.1).
 */
export function PeriodPicker() {
  const { t } = useTranslation();
  const { intlLocale } = useLocale();
  const availablePeriods = useTransactionStore((state) => state.availablePeriods);
  const selectedPeriod = useTransactionStore((state) => state.selectedPeriod);
  const setPeriod = useTransactionStore((state) => state.setPeriod);

  const options: DropdownOption<string>[] = availablePeriods.map((period) => ({
    value: period,
    label: formatPeriodLabel(period, intlLocale),
  }));

  return (
    <div className="flex flex-col gap-0.5">
      <span className="hidden text-[0.6875rem] font-semibold tracking-wide text-text-muted uppercase sm:block">
        {t('app.periodPicker.label')}
      </span>
      <Dropdown
        variant="title"
        label={t('app.periodPicker.label')}
        value={selectedPeriod}
        options={options}
        onChange={setPeriod}
      />
    </div>
  );
}
