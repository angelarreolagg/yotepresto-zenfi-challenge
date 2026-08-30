import { createElement } from 'react';
import { MX, US } from 'country-flag-icons/react/3x2';

import type { Language } from '@/shared/i18n/languages';

const FLAGS = { es: MX, en: US } as const;

interface LanguageFlagProps {
  language: Language;
  className?: string;
}

/** Read out of a static map with createElement, not a capitalised binding (CODESTYLE §6). */
export function LanguageFlag({ language, className = 'h-3 w-4 rounded-[2px]' }: LanguageFlagProps) {
  return createElement(FLAGS[language], { 'aria-hidden': true, className });
}
