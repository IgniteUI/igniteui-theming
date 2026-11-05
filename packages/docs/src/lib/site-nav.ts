// Navbar link data for a page: version dropdown targets, locale switcher targets and the Docs link.
import { getAllDocsModels } from './docs/astro-model';
import {
  LOCALE_LIST,
  VERSIONS,
  VERSION_LIST,
  LAST_VERSION,
  type Locale,
  type Version,
} from './docs/config';
import { localePathCounterpart, versionCounterpart } from './docs/versions';

export interface NavLink {
  label: string;
  href: string;
  active: boolean;
}

export interface SiteNav {
  versionLinks: NavLink[];
  localeLinks: (NavLink & { locale: Locale })[];
  docsHref: string;
}

/** `pathname` is the page path including the site base (e.g. `/theming-docs/ja/docs/...`). */
export async function getSiteNav(
  locale: Locale,
  pathname: string,
  doc?: { id: string; version: Version }
): Promise<SiteNav> {
  const models = await getAllDocsModels();
  const model = (l: Locale, v: Version) => models.get(`${l}/${v}`)!;
  const activeVersion = doc?.version ?? LAST_VERSION;

  const versionLinks = VERSION_LIST.map((v) => ({
    label: VERSIONS[v].label,
    href: versionCounterpart(doc?.id, model(locale, v)),
    active: v === activeVersion,
  }));

  const localeLinks = LOCALE_LIST.map((l) => {
    const shortLabel = l.charAt(0).toUpperCase() + l.slice(1);
    return {
      locale: l,
      label: shortLabel,
      href: doc
        ? versionCounterpart(doc.id, model(l, doc.version))
        : localePathCounterpart(pathname, locale, l),
      active: l === locale,
    };
  });

  return {
    versionLinks,
    localeLinks,
    docsHref: versionCounterpart(undefined, model(locale, activeVersion)),
  };
}
