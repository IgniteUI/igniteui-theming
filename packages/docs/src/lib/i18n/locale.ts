// Message lookup for `translate()`. Messages come from `i18n/ja/code.json`. Server code passes the page locale
// explicitly (`Astro.currentLocale` or a `locale` prop); in the browser it is read from `<html lang>`.
import jaMessages from '../../../i18n/ja/code.json';
import type { Locale } from '../docs/config';

type Messages = Record<string, { message: string; description?: string }>;
const MESSAGES: Partial<Record<Locale, Messages>> = {
  ja: jaMessages as Messages,
};

/** The page locale in the browser. Server rendering must pass the locale explicitly instead. */
export function pageLocale(): Locale {
  if (typeof document === 'undefined')
    throw new Error(
      'translate() needs an explicit locale while rendering on the server'
    );
  return document.documentElement.lang.toLowerCase().startsWith('ja')
    ? 'ja'
    : 'en';
}

export function lookupMessage(
  id: string | undefined,
  fallback: string,
  locale: Locale = pageLocale()
): string {
  if (!id) return fallback;
  return MESSAGES[locale]?.[id]?.message ?? fallback;
}
