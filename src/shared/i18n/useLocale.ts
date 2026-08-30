import { useTranslation } from 'react-i18next';

import { resolveLanguage, toIntlLocale } from './languages';

/**
 * The single place a component reads "what language/locale are we in" — so formatting always
 * goes through `Intl` with this value, never a hardcoded 'es-MX' (CODESTYLE §2).
 */
export function useLocale() {
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);

  return { language, intlLocale: toIntlLocale(language) };
}
