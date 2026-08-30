import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import { DEFAULT_LANGUAGE, resolveLanguage, type Language } from './languages';

/**
 * Must run before `createRoot` (see app/main.tsx): resources are passed in directly rather than
 * loaded by a backend plugin, so `t()` resolves synchronously from the first render and no
 * component ever paints a raw translation key.
 *
 * `persistedLanguage` comes from our own store's persisted decisions (entities/transaction),
 * never from the detector's own cache — `caches: []` disables that so there is exactly one
 * source of truth for "which language survives a reload". The detector still picks a sensible
 * default from the browser on a first-ever visit, when nothing has been persisted yet.
 */
export function initI18n(persistedLanguage: Language | null): typeof i18n {
  // Kept in sync with the active language for screen readers, spell-check and browser features
  // that read it — i18next fires this once during init too, so it covers the first paint.
  i18n.on('languageChanged', (lng: string) => {
    document.documentElement.lang = resolveLanguage(lng);
  });

  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { es: { translation: es }, en: { translation: en } },
      lng: persistedLanguage ?? undefined,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: ['es', 'en'],
      interpolation: { escapeValue: false },
      detection: { order: ['navigator'], caches: [] },
    });

  return i18n;
}

export default i18n;
