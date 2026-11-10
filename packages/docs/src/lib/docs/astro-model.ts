// Astro-side access to the docs model: sources come from the content collections.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { CollectionName } from '../../content.config';
import {
  contentRoot,
  LOCALE_LIST,
  VERSION_LIST,
  type Locale,
  type Version,
} from './config';
import { buildDocsModel, type DocsModel } from './model';
import { sidebarTranslations } from './sidebar-translations';
import type { CategoryMetadata, DocFrontmatter, DocSource } from './types';

const suffix = (locale: Locale, version: Version) =>
  `${locale === 'en' ? '' : `-${locale}`}${version === 'current' ? '' : '-v24'}`;

export function collectionName(locale: Locale, version: Version) {
  return `docs${suffix(locale, version)}` as DocsCollectionName;
}
function categoriesCollectionName(locale: Locale, version: Version) {
  return `categories${suffix(locale, version)}` as CategoriesCollectionName;
}

type DocsCollectionName = Extract<CollectionName, `docs${string}`>;
type CategoriesCollectionName = Extract<CollectionName, `categories${string}`>;
export type DocEntry = CollectionEntry<DocsCollectionName>;

function toSource(
  entry: DocEntry,
  locale: Locale,
  version: Version
): DocSource {
  const base = `${contentRoot(locale, version)}/`;
  const filePath = entry.filePath ?? '';
  const relativePath = filePath.startsWith(base)
    ? filePath.slice(base.length)
    : filePath;
  return {
    relativePath,
    frontmatter: entry.data as DocFrontmatter,
    body: entry.body ?? '',
  };
}

const modelCache = new Map<
  string,
  Promise<DocsModel & { entries: Map<string, DocEntry> }>
>();

/** Docs model for a locale × version, built once per build. `entries` maps doc id → collection entry (for `render()`). */
export function getDocsModel(locale: Locale, version: Version) {
  const key = `${locale}/${version}`;
  let promise = modelCache.get(key);
  if (!promise) {
    promise = (async () => {
      const entries = await getCollection(collectionName(locale, version));
      const sources = entries.map((e) => toSource(e, locale, version));
      const categories = Object.fromEntries(
        (await getCollection(categoriesCollectionName(locale, version))).map(
          (c) => [c.id, c.data as CategoryMetadata]
        )
      );
      const model = buildDocsModel({
        locale,
        version,
        sources,
        categories,
        translations: sidebarTranslations(locale, version),
      });
      const byId = new Map<string, DocEntry>();
      for (const entry of entries) {
        const source = toSource(entry, locale, version);
        const doc = model.docs.find(
          (d) => d.relativePath === source.relativePath
        );
        if (doc) byId.set(doc.id, entry);
      }
      return Object.assign(model, { entries: byId });
    })();
    modelCache.set(key, promise);
  }
  return promise;
}

export async function getAllDocsModels() {
  const models = await Promise.all(
    LOCALE_LIST.flatMap((l) =>
      VERSION_LIST.map(
        async (v) => [`${l}/${v}`, await getDocsModel(l, v)] as const
      )
    )
  );
  return new Map(models);
}
