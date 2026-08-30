import { useTranslation } from 'react-i18next';

import { useTransactionStore } from '@/entities/transaction';
import { SUPPORTED_LANGUAGES, resolveLanguage, type Language } from '@/shared/i18n/languages';
import { cn } from '@/shared/lib/cn';
import { LanguageFlag } from '@/shared/ui/LanguageFlag';

/** Segmented pills, active pill on surface-raised over a surface-sunken track (STYLEGUIDE §6.3). */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);
  const setLanguage = useTransactionStore((state) => state.setLanguage);

  const pick = (next: Language) => {
    if (next === language) return;
    void i18n.changeLanguage(next);
    setLanguage(next);
  };

  return (
    <div
      role="group"
      aria-label={t('app.languageSwitcher.label')}
      className="flex items-center gap-0.5 rounded-full bg-surface-sunken p-0.5"
    >
      {SUPPORTED_LANGUAGES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === language}
          onClick={() => pick(option)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-[color,background-color,transform] active:scale-[0.97]',
            option === language ? 'bg-surface-raised text-text-primary' : 'text-text-secondary',
          )}
        >
          <LanguageFlag language={option} />
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
