import { useRef, useState } from 'react';
import { HelpCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTransactionStore } from '@/entities/transaction';
import { useOnboardingStore } from '@/features/onboarding';
import { findUser } from '@/shared/config/users';
import { cn } from '@/shared/lib/cn';
import { useScrolled } from '@/shared/ui/useScrolled';

import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { PeriodPicker } from './PeriodPicker';
import { PAGE_CONTAINER } from './pageContainer';
import { ProfileMenu } from './ProfileMenu';
import { ResetConfirmDialog } from './ResetConfirmDialog';
import { UserSwitcher } from './UserSwitcher';

/**
 * One shell holding two rows over a shared surface, which is what keeps the small label text in
 * row 2 legible (ROADMAP §6.1). `z-30` is load-bearing: without it, the dropdown panels this bar
 * hosts (PeriodPicker, UserSwitcher) would only be ordered within the bar's own stacking context
 * and would paint under the first card.
 */
export function TopBar() {
  const { t } = useTranslation();
  const scrolled = useScrolled(8);
  const currentUser = useTransactionStore((state) => state.currentUser);
  const user = findUser(currentUser);
  const startOnboarding = useOnboardingStore((state) => state.start);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  // ProfileMenu and ResetConfirmDialog are local state, not createOverlayStore, so they don't get
  // its automatic focus capture/restore for free — wired here instead (STYLEGUIDE §10: every
  // overlay returns focus to its trigger on close).
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const resetTriggerRef = useRef<HTMLButtonElement>(null);

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
    profileTriggerRef.current?.focus();
  };

  const closeResetDialog = () => {
    setResetDialogOpen(false);
    resetTriggerRef.current?.focus();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b bg-surface/70 backdrop-blur-md transition-colors duration-200',
        scrolled ? 'border-border/70' : 'border-transparent',
      )}
    >
      <div className={cn(PAGE_CONTAINER, 'flex h-11 items-center justify-between sm:h-14')}>
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-text-secondary sm:inline">
            {t('app.greeting.prefix')}
          </span>
          <span className="text-sm text-text-secondary sm:hidden">
            {t('app.greeting.full', { name: user?.name ?? '' })}
          </span>
          <div className="hidden items-center gap-2 sm:flex">
            <UserSwitcher />
            <LanguageSwitcher />
          </div>
          <button
            ref={profileTriggerRef}
            type="button"
            aria-label={t('app.menu.open')}
            onClick={() => setProfileMenuOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white transition-transform active:scale-90 sm:hidden"
            style={{ backgroundColor: user?.color }}
          >
            {user?.initial}
          </button>
        </div>
      </div>

      <div className="border-t border-border">
        <div
          className={cn(PAGE_CONTAINER, 'flex items-center justify-between gap-2 py-1.5 sm:py-3')}
        >
          <PeriodPicker />
          <div className="flex items-center gap-1">
            <button
              ref={resetTriggerRef}
              type="button"
              aria-label={t('app.reset.button')}
              onClick={() => setResetDialogOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-transform active:scale-90"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              aria-label={t('app.help.button')}
              onClick={startOnboarding}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-transform active:scale-90"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </div>

      <ProfileMenu isOpen={profileMenuOpen} onClose={closeProfileMenu} />
      <ResetConfirmDialog isOpen={resetDialogOpen} onClose={closeResetDialog} />
    </header>
  );
}
