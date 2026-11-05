// Reads doc sources and `_category_.json` files straight from the content folders, for the unit tests and
// Node-side tooling. Astro pages read the same files through the content collections (`astro-model.ts`).
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { contentRoot, type Locale, type Version } from './config';
import type { CategoryMetadata, DocFrontmatter, DocSource } from './types';

export function loadDocSourcesFromFs(
  rootDir: string,
  locale: Locale,
  version: Version
): DocSource[] {
  const base = path.join(rootDir, contentRoot(locale, version));
  const sources: DocSource[] = [];
  const walk = (dirAbs: string, rel: string) => {
    for (const entry of readdirSync(dirAbs, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dirAbs, entry.name), relPath);
      } else if (/\.mdx?$/.test(entry.name)) {
        const { data, content } = matter(
          readFileSync(path.join(dirAbs, entry.name), 'utf8')
        );
        sources.push({
          relativePath: relPath,
          frontmatter: data as DocFrontmatter,
          body: content,
        });
      }
    }
  };
  walk(base, '');
  return sources.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

const CATEGORY_FILE = '_category_.json';

/** `{ 'core-concepts/colors': {...}, '.': {...} }` keyed by directory relative to the content root. */
export function loadCategoriesFromFs(
  rootDir: string,
  locale: Locale,
  version: Version
): Record<string, CategoryMetadata> {
  const result: Record<string, CategoryMetadata> = {};
  const walk = (dirAbs: string, rel: string) => {
    for (const entry of readdirSync(dirAbs, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(
          path.join(dirAbs, entry.name),
          rel ? `${rel}/${entry.name}` : entry.name
        );
      } else if (entry.name === CATEGORY_FILE) {
        result[rel || '.'] = JSON.parse(
          readFileSync(path.join(dirAbs, entry.name), 'utf8')
        ) as CategoryMetadata;
      }
    }
  };
  walk(path.join(rootDir, contentRoot(locale, version)), '');
  return result;
}
