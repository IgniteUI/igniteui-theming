// `useBaseUrl()` prefixes a path with the site base: `{ asset: true }` for static files, `{ locale }` for
// document links, which get that locale's base (`/theming-docs/`, `/theming-docs/ja/`).
import { type Locale, localeBase, SITE_BASE, SITE_URL } from '../docs/config';

export interface BaseUrlOptions {
  forcePrefix?: boolean;
  absolute?: boolean;
  /** Static files (`public/`) live under the site base only; document links get the locale base. */
  asset?: boolean;
  /** Required for document links (`asset: false`): the locale whose base the link gets. */
  locale?: Locale;
}

export function withBaseUrl(
  url: string,
  {
    forcePrefix = false,
    absolute = false,
    asset = false,
    locale,
  }: BaseUrlOptions = {}
): string {
  if (!url) return url;
  if (url.startsWith('#')) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) return url;
  if (!forcePrefix && (url === SITE_BASE || url.startsWith(`${SITE_BASE}/`)))
    return url;
  if (!asset && !locale)
    throw new Error('useBaseUrl() needs { locale } for a document link');
  const prefix = asset ? SITE_BASE : localeBase(locale as Locale);
  const basePath = `${prefix}/${url.replace(/^\//, '')}`;
  return absolute ? SITE_URL + basePath : basePath;
}

export default function useBaseUrl(
  url: string,
  options?: BaseUrlOptions
): string {
  return withBaseUrl(url, options);
}

export function useBaseUrlUtils() {
  return { withBaseUrl };
}
