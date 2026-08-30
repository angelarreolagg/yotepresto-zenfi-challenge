import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Amount,
  CATEGORIES,
  CategoryIcon,
  isKnownCategory,
  useTransactionStore,
  type KnownCategory,
} from '@/entities/transaction';
import { useLocale } from '@/shared/i18n/useLocale';
import { formatDateFromKey } from '@/shared/lib/format';
import { Dropdown, type DropdownOption } from '@/shared/ui/Dropdown';
import { Modal } from '@/shared/ui/Modal';

import { useEditCategoryOverlay } from '../model/editCategoryOverlay';
import { TransactionDetails } from './TransactionDetails';

/**
 * A modal, not an inline select: inline is fewer clicks but leaves nowhere to explain *why* a
 * row is flagged (ROADMAP §6.6). The transaction is looked up live from the store by id rather
 * than held in the overlay payload, so it always reflects the correction just made. The
 * correction applies the moment a category is picked — this button only closes; its "save"
 * label is a familiar affordance, not a gate, since there is no pending state to lose.
 */
export function EditCategoryModal() {
  const { t } = useTranslation();
  const { intlLocale } = useLocale();
  const titleId = useId();

  const isOpen = useEditCategoryOverlay((state) => state.isOpen);
  const payload = useEditCategoryOverlay((state) => state.payload);
  const close = useEditCategoryOverlay((state) => state.close);

  const updateCategory = useTransactionStore((state) => state.updateCategory);
  const transaction = useTransactionStore((state) =>
    payload === null
      ? undefined
      : state.transactions.find((candidate) => candidate.id === payload.transactionId),
  );

  if (!isOpen || transaction === undefined) return null;

  const categoryOptions: DropdownOption<KnownCategory>[] = CATEGORIES.map((category) => ({
    value: category,
    label: category,
    icon: <CategoryIcon category={category} size="sm" />,
  }));

  return (
    <Modal isOpen={isOpen} onClose={close} titleId={titleId} title={t('editCategory.title')}>
      <div className="flex items-center gap-3 rounded-xl bg-surface-raised p-3">
        <CategoryIcon category={transaction.category} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{transaction.description}</p>
          <p className="text-xs text-text-secondary">
            {formatDateFromKey(transaction.dateKey, intlLocale, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Amount amountMXN={transaction.metadata.amountMXN} />
      </div>

      <TransactionDetails transaction={transaction} />

      <Dropdown
        variant="field"
        label={t('editCategory.categoryLabel')}
        placeholder={t('editCategory.categoryPlaceholder')}
        value={isKnownCategory(transaction.category) ? transaction.category : null}
        options={categoryOptions}
        onChange={(category) => updateCategory(transaction.id, category)}
      />

      <button
        type="button"
        onClick={close}
        className="w-full rounded-xl bg-accent py-3 text-center text-sm font-semibold text-white transition-transform active:scale-[0.97]"
      >
        {t('editCategory.save')}
      </button>
    </Modal>
  );
}
