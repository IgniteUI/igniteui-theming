// Static paths for the doc routes: one catch-all page renders every locale × version.
import {
  LOCALE_LIST,
  VERSION_LIST,
  versionPath,
  versionRoutePrefix,
  type Locale,
  type Version,
} from './config';
import { getDocsModel } from './astro-model';
import type { DocMeta } from './types';

export interface DocRouteProps {
  locale: Locale;
  version: Version;
  doc: DocMeta;
}

/** `/theming-docs/docs/24.0.0/core-concepts/colors/overview` → `core-concepts/colors/overview` (Astro `[...slug]`). */
export function permalinkToSlugParam(
  permalink: string,
  locale: Locale,
  version: Version
): string {
  const prefix = versionPath(locale, version);
  return permalink.slice(prefix.length).replace(/^\/+|\/+$/g, '');
}

export async function docStaticPaths(locale: Locale, version: Version) {
  const model = await getDocsModel(locale, version);
  return model.docs.map((doc) => ({
    params: { slug: permalinkToSlugParam(doc.permalink, locale, version) },
    props: { locale, version, doc } satisfies DocRouteProps,
  }));
}

/** Every doc of every locale × version as `[...slug]` params (`docs/x`, `docs/24.0.0/x`, `ja/docs/x`, …). */
export async function allDocStaticPaths() {
  const groups = await Promise.all(
    LOCALE_LIST.flatMap((locale) =>
      VERSION_LIST.map(async (version) => {
        const prefix = versionRoutePrefix(locale, version).replace(/^\//, '');
        return (await docStaticPaths(locale, version)).map((p) => ({
          ...p,
          params: { slug: `${prefix}/${p.params.slug}` },
        }));
      })
    )
  );
  return groups.flat();
}
