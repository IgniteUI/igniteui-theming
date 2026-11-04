// The assembled docs model for one locale × version: docs, sidebar, navigation.
// Pure: the sources and category metadata come from the content collections (Astro) or from disk (tests).
import type { Locale, Version } from './config';
import { getDocMeta } from './ids';
import type { SidebarTranslations } from './sidebar-translations';
import { getBreadcrumbs, getDocNavigation, mainDocId } from './navigation';
import { normalizeSidebar, toSidebarItems, docsById } from './sidebar';
import { sidebarDef } from './sidebar-defs';
import type {
  Breadcrumb,
  CategoryMetadata,
  DocMeta,
  DocSource,
  NavigationLink,
  SidebarItem,
  SidebarNode,
} from './types';

export interface DocsModel {
  locale: Locale;
  version: Version;
  docs: DocMeta[];
  byId: Map<string, DocMeta>;
  byPermalink: Map<string, DocMeta>;
  sidebarNodes: SidebarNode[];
  sidebar: SidebarItem[];
  mainDocId: string;
  navigation(doc: DocMeta): {
    previous?: NavigationLink;
    next?: NavigationLink;
  };
  breadcrumbs(doc: DocMeta): Breadcrumb[];
}

export interface DocsModelInput {
  locale: Locale;
  version: Version;
  sources: DocSource[];
  /** `_category_.json` contents keyed by directory relative to the content root (`.` for the root). */
  categories: Record<string, CategoryMetadata>;
  translations: SidebarTranslations | undefined;
}

export function buildDocsModel({
  locale,
  version,
  sources,
  categories,
  translations,
}: DocsModelInput): DocsModel {
  const docs = sources
    .map((s) => getDocMeta(s, locale, version))
    .sort((a, b) => a.id.localeCompare(b.id));
  const byId = docsById(docs);
  const byPermalink = new Map(docs.map((d) => [d.permalink, d]));
  const sidebarNodes = normalizeSidebar(sidebarDef(locale, version), {
    docs,
    categories,
    translations,
  });
  const sidebar = toSidebarItems(sidebarNodes, docs);
  return {
    locale,
    version,
    docs,
    byId,
    byPermalink,
    sidebarNodes,
    sidebar,
    mainDocId: mainDocId(sidebarNodes, docs),
    navigation: (doc) => getDocNavigation(doc, sidebarNodes, byId),
    breadcrumbs: (doc) => getBreadcrumbs(sidebar, doc.permalink),
  };
}
