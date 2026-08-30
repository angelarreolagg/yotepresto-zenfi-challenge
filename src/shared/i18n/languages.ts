export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'es';

/**
 * Currency stays MXN regardless of language (CODESTYLE §2) — only the number/date formatting
 * conventions follow the interface language.
 */
const INTL_LOCALES: Record<Language, string> = {
  es: 'es-MX',
  en: 'en-US',
};

export function isSupportedLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * i18n.language can carry a region (en-US, es-419). Resolved to a base tag once, here, rather
 * than making every caller remember the region exists.
 */
export function resolveLanguage(tag: string): Language {
  const base = tag.split('-')[0]?.toLowerCase() ?? '';
  return isSupportedLanguage(base) ? base : DEFAULT_LANGUAGE;
}

export function toIntlLocale(language: Language): string {
  return INTL_LOCALES[language];
}
