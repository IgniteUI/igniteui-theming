// One content collection per locale × version.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { contentRoot } from './lib/docs/config';

/** Only the frontmatter keys the content actually uses; anything else fails the build. */
const docSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    sidebar_position: z.number().optional(),
    hide_title: z.boolean().optional(),
    pagination_next: z.string().nullable().optional(),
    /** Not read by the theme; allowed so existing files validate. */
    pagination_next_label: z.string().optional(),
  })
  .strict();

const docsCollection = (base: string) =>
  defineCollection({
    loader: glob({
      pattern: '**/*.{md,mdx}',
      base,
      // Keep path-style ids (`core-concepts/colors/overview`) instead of slugified ones.
      generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
    }),
    schema: docSchema,
  });

/** The `_category_.json` files of a content folder, keyed by their directory (`core-concepts/colors`). */
const categoriesCollection = (base: string) =>
  defineCollection({
    loader: glob({
      pattern: '**/_category_.json',
      base,
      generateId: ({ entry }) =>
        entry.replace(/\/?_category_\.json$/, '') || '.',
    }),
  });

export const collections = {
  docs: docsCollection(`./${contentRoot('en', 'current')}`),
  'docs-v24': docsCollection(`./${contentRoot('en', '24.0.0')}`),
  'docs-ja': docsCollection(`./${contentRoot('ja', 'current')}`),
  'docs-ja-v24': docsCollection(`./${contentRoot('ja', '24.0.0')}`),
  categories: categoriesCollection(`./${contentRoot('en', 'current')}`),
  'categories-v24': categoriesCollection(`./${contentRoot('en', '24.0.0')}`),
  'categories-ja': categoriesCollection(`./${contentRoot('ja', 'current')}`),
  'categories-ja-v24': categoriesCollection(`./${contentRoot('ja', '24.0.0')}`),
};

export type CollectionName = keyof typeof collections;
