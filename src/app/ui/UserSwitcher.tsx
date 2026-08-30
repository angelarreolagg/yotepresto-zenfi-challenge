import { useTranslation } from 'react-i18next';

import { useTransactionStore } from '@/entities/transaction';
import { DEMO_USERS } from '@/shared/config/users';
import { Dropdown, type DropdownOption } from '@/shared/ui/Dropdown';

export function UserSwitcher() {
  const { t } = useTranslation();
  const currentUser = useTransactionStore((state) => state.currentUser);
  const setUser = useTransactionStore((state) => state.setUser);

  const options: DropdownOption<string>[] = DEMO_USERS.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  return (
    <Dropdown
      variant="title"
      label={t('app.userSwitcher.label')}
      value={currentUser}
      options={options}
      onChange={setUser}
    />
  );
}
