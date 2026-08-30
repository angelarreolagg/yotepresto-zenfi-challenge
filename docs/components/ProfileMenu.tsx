import { Check, X } from 'lucide-react';
import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useTransactionStore } from '@/entities/transaction';
import { DEMO_USERS, findUser } from '@/shared/config/users';
import { SUPPORTED_LANGUAGES, resolveLanguage, type Language } from '@/shared/i18n/languages';
import { cn } from '@/shared/lib/cn';
import { LanguageFlag } from '@/shared/ui/LanguageFlag';

/**
 * The staggered layers behind the panel. Taken from the category series rather than invented, so
 * the one moment of large colour in the app still belongs to the same palette.
 */
const PRELAYERS = ['#7b61ff', '#0a84ff'];

const STEP_MS = 60;
const ITEM_STEP_MS = 45;

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Phone-only side sheet holding the two controls that used to sit in the navbar: the profile and
 * the language. On a 390px bar they were two dropdowns competing with the logo for room; behind a
 * profile icon they cost nothing until they are wanted.
 *
 * It stays mounted and slides on `translate-x` rather than unmounting, which is what gives it a
 * real exit animation: an unmounting panel would have nothing left to animate. Closed, it is
 * `inert`, so nothing inside it is focusable or read out.
 *
 * The stagger is plain CSS `transition-delay`. The layers have to arrive in order and leave in
 * reverse, and a declarative delay cannot end up stuck half-applied the way a frame-driven
 * animation can — which is exactly how the entrance animations used to fail.
 */
export const ProfileMenu = ({ isOpen, onClose }: ProfileMenuProps) => {
  const { t, i18n } = useTranslation();
  const titleId = useId();

  const currentUser = useTransactionStore((state) => state.currentUser);
  const setUser = useTransactionStore((state) => state.setUser);
  const setLanguage = useTransactionStore((state) => state.setLanguage);
  const language = resolveLanguage(i18n.language);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  /** Layers lead on the way in and trail on the way out. That reversal is the whole effect. */
  const slideDelay = (index: number) => (isOpen ? index : PRELAYERS.length - index) * STEP_MS;

  const itemDelay = (index: number) =>
    isOpen ? PRELAYERS.length * STEP_MS + 100 + index * ITEM_STEP_MS : 0;

  const pickLanguage = (next: Language) => {
    if (next !== language) {
      void i18n.changeLanguage(next);
      setLanguage(next);
    }
    onClose();
  };

  const pickUser = (id: string) => {
    setUser(id);
    onClose();
  };

  const itemClass =
    'flex w-full items-center gap-2 py-1.5 text-left text-base font-semibold transition-all duration-300 ease-out';

  return createPortal(
    <div
      inert={!isOpen}
      className={cn('fixed inset-0 z-40 sm:hidden', !isOpen && 'pointer-events-none')}
    >
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      {PRELAYERS.map((color, index) => (
        <div
          key={color}
          aria-hidden
          className={cn(
            'absolute inset-y-0 right-0 w-1/2 transition-transform duration-300 ease-out',
            isOpen ? 'translate-x-0' : 'translate-x-full',
          )}
          style={{ backgroundColor: color, transitionDelay: `${slideDelay(index)}ms` }}
        />
      ))}

      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        className={cn(
          'absolute inset-y-0 right-0 flex w-1/2 flex-col gap-5 bg-surface p-4 shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ transitionDelay: `${slideDelay(PRELAYERS.length)}ms` }}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id={titleId} className="flex min-w-0 items-center gap-2 text-base font-bold">
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm text-white"
              style={{ backgroundColor: findUser(currentUser)?.color }}
            >
              {findUser(currentUser)?.initial}
            </span>
            <span className="truncate">{findUser(currentUser)?.name}</span>
          </h2>
          <button
            type="button"
            aria-label={t('app.menu.close')}
            onClick={onClose}
            className="-mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex flex-col gap-4">
          <section className="flex flex-col gap-1">
            <h3 className="text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">
              {t('app.menu.profile')}
            </h3>
            <ul>
              {DEMO_USERS.map((user, index) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => pickUser(user.id)}
                    aria-current={user.id === currentUser}
                    className={cn(itemClass, isOpen ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0')}
                    style={{ transitionDelay: `${itemDelay(index)}ms` }}
                  >
                    <span className="w-4 shrink-0 text-[0.625rem] font-normal tabular-nums text-text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 truncate">{user.name}</span>
                    {user.id === currentUser && <Check size={15} className="shrink-0 text-accent" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-1">
            <h3 className="text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">
              {t('app.menu.language')}
            </h3>
            <ul>
              {SUPPORTED_LANGUAGES.map((option, index) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => pickLanguage(option)}
                    aria-current={option === language}
                    className={cn(itemClass, isOpen ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0')}
                    style={{ transitionDelay: `${itemDelay(DEMO_USERS.length + index)}ms` }}
                  >
                    <LanguageFlag language={option} />
                    <span className="flex-1 truncate">{t(`app.language.${option}`)}</span>
                    {option === language && <Check size={15} className="shrink-0 text-accent" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </nav>
      </aside>
    </div>,
    document.body,
  );
};
