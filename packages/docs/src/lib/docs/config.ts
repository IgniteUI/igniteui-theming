// Site, locale and version configuration for the docs model.
// Paths keep the published URL structure.

export const SITE_URL = 'https://staging.infragistics.com';
export const SITE_BASE = '/theming-docs';
export const SITE_TITLE = 'Ignite UI Theming';

export const LOCALES = {
  en: { htmlLang: 'en-US', label: 'English', path: '' },
  ja: { htmlLang: 'ja-JP', label: '日本語', path: 'ja' },
} as const;
export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = 'en';
/** Narrows `Astro.currentLocale` (a string, possibly undefined) to a known locale. */
export function localeFrom(value: string | undefined): Locale {
  return value === 'ja' ? 'ja' : DEFAULT_LOCALE;
}
export const LOCALE_LIST = Object.keys(LOCALES) as Locale[];

export const VERSIONS = {
  current: { label: 'v.25.0.0', path: '' },
  '24.0.0': { label: 'v.24.0.0', path: '24.0.0' },
} as const;
export type Version = keyof typeof VERSIONS;
export const LAST_VERSION: Version = 'current';
export const VERSION_LIST = Object.keys(VERSIONS) as Version[];

/** Content folder (relative to the repo root) for a locale × version. */
export function contentRoot(locale: Locale, version: Version): string {
  if (locale === 'en') {
    return version === 'current' ? 'docs' : `versioned_docs/version-${version}`;
  }
  return `i18n/${locale}/docs/${version === 'current' ? 'current' : `version-${version}`}`;
}

/** `/theming-docs`, `/theming-docs/ja` */
export function localeBase(locale: Locale): string {
  const p = LOCALES[locale].path;
  return p ? `${SITE_BASE}/${p}` : SITE_BASE;
}

/** Version base path: `/theming-docs/docs`, `/theming-docs/ja/docs/24.0.0`, … */
export function versionPath(locale: Locale, version: Version): string {
  const v = VERSIONS[version].path;
  return `${localeBase(locale)}/docs${v ? `/${v}` : ''}`;
}

/** Route-file prefix used by `src/pages/**` (without the site base): `/docs`, `/ja/docs/24.0.0`, … */
export function versionRoutePrefix(locale: Locale, version: Version): string {
  return versionPath(locale, version).slice(SITE_BASE.length);
}
