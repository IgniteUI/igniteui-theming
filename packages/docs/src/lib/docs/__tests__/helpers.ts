import path from 'node:path';
import { readFileSync } from 'node:fs';
import {
  LOCALE_LIST,
  VERSION_LIST,
  type Locale,
  type Version,
} from '../config';
import { loadCategoriesFromFs, loadDocSourcesFromFs } from '../fs-loader';
import { buildDocsModel, type DocsModel } from '../model';
import { sidebarTranslations } from '../sidebar-translations';

export const rootDir = path.resolve(import.meta.dirname, '../../../..');

export function readSnapshot<T>(name: string): T {
  return JSON.parse(
    readFileSync(path.join(import.meta.dirname, 'snapshots', name), 'utf8')
  ) as T;
}

export const combos: [Locale, Version][] = LOCALE_LIST.flatMap((l) =>
  VERSION_LIST.map((v): [Locale, Version] => [l, v])
);

const cache = new Map<string, DocsModel>();
export function model(locale: Locale, version: Version): DocsModel {
  const key = `${locale}/${version}`;
  let m = cache.get(key);
  if (!m) {
    m = buildDocsModel({
      locale,
      version,
      sources: loadDocSourcesFromFs(rootDir, locale, version),
      categories: loadCategoriesFromFs(rootDir, locale, version),
      translations: sidebarTranslations(locale, version),
    });
    cache.set(key, m);
  }
  return m;
}

/** `/theming-docs/docs/foo` → `/docs/foo/index.html` (how the snapshots key routes). */
export function permalinkToFile(permalink: string): string {
  const p = permalink.replace(/^\/theming-docs/, '');
  return `${p.endsWith('/') ? p : `${p}/`}index.html`;
}
