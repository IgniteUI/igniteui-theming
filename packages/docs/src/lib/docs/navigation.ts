// previous/next, breadcrumbs and the version entry doc.
import type {
  Breadcrumb,
  DocMeta,
  NavigationLink,
  SidebarItem,
  SidebarNode,
} from './types';

/** Pre-order flatten (a category precedes its items). */
export function flattenSidebar(nodes: SidebarNode[]): SidebarNode[] {
  return nodes.flatMap((node) =>
    node.type === 'category' ? [node, ...flattenSidebar(node.items)] : [node]
  );
}

type NavigationNode =
  | Extract<SidebarNode, { type: 'doc' }>
  | (Extract<SidebarNode, { type: 'category' }> & {
      link: { type: 'doc'; id: string };
    });

/** `collectSidebarNavigation`: docs and doc-linked categories, in reading order. */
export function collectNavigation(nodes: SidebarNode[]): NavigationNode[] {
  return flattenSidebar(nodes).flatMap((node): NavigationNode[] => {
    if (node.type === 'category' && node.link) return [node as NavigationNode];
    if (node.type === 'doc') return [node];
    return [];
  });
}

/** The doc a version dropdown lands on: the first doc of the sidebar (`getMainDocId`). */
export function mainDocId(nodes: SidebarNode[], docs: DocMeta[]): string {
  const home = docs.find((d) => d.slug === '/');
  if (home) return home.id;
  const first = collectNavigation(nodes)[0];
  if (first) return first.type === 'doc' ? first.id : first.link.id;
  return docs[0]!.id;
}

function toDocNavigationLink(
  doc: DocMeta,
  sidebarItemLabel?: string
): NavigationLink {
  return {
    title:
      doc.frontmatter.pagination_label ??
      doc.frontmatter.sidebar_label ??
      sidebarItemLabel ??
      doc.title,
    permalink: doc.permalink,
  };
}

/** `getDocNavigation` + `addDocNavigation`: previous/next with the `pagination_prev`/`pagination_next` overrides. */
export function getDocNavigation(
  doc: DocMeta,
  nodes: SidebarNode[],
  byId: Map<string, DocMeta>
): { previous?: NavigationLink; next?: NavigationLink } {
  const items = collectNavigation(nodes);
  const index = items.findIndex((item) =>
    item.type === 'doc' ? item.id === doc.id : item.link.id === doc.id
  );
  const toLink = (
    item: NavigationNode | undefined
  ): NavigationLink | undefined => {
    if (!item) return undefined;
    if (item.type === 'category')
      return toDocNavigationLink(byId.get(item.link.id)!);
    return toDocNavigationLink(byId.get(item.id)!, item.label);
  };
  const byFrontmatter = (
    id: string | null | undefined,
    type: 'prev' | 'next'
  ): NavigationLink | undefined => {
    if (!id) return undefined;
    const target = byId.get(id);
    if (!target) {
      throw new Error(
        `Error when loading ${doc.id}: the pagination_${type} front matter points to a non-existent ID ${id}.`
      );
    }
    return toDocNavigationLink(target);
  };
  const previous =
    doc.frontmatter.pagination_prev !== undefined
      ? byFrontmatter(doc.frontmatter.pagination_prev, 'prev')
      : index === -1
        ? undefined
        : toLink(items[index - 1]);
  const next =
    doc.frontmatter.pagination_next !== undefined
      ? byFrontmatter(doc.frontmatter.pagination_next, 'next')
      : index === -1
        ? undefined
        : toLink(items[index + 1]);
  return { previous, next };
}

function isSamePath(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const norm = (p: string) => (p.endsWith('/') ? p.slice(0, -1) : p);
  return norm(a) === norm(b);
}

/** `getSidebarBreadcrumbs` over the rendered sidebar items; the last crumb is the current page. */
export function getBreadcrumbs(
  items: SidebarItem[],
  pathname: string
): Breadcrumb[] {
  const crumbs: SidebarItem[] = [];
  const extract = (list: SidebarItem[]): boolean => {
    for (const item of list) {
      if (item.type === 'category') {
        if (isSamePath(item.href, pathname) || extract(item.items)) {
          crumbs.unshift(item);
          return true;
        }
      } else if (
        item.type === 'link' &&
        item.docId &&
        isSamePath(item.href, pathname)
      ) {
        crumbs.unshift(item);
        return true;
      }
    }
    return false;
  };
  extract(items);
  return crumbs.map((item, i) => {
    if (item.type === 'html')
      throw new Error('html sidebar items cannot be breadcrumbs');
    return {
      label: item.label,
      ...(i < crumbs.length - 1 && item.href && { href: item.href }),
    };
  });
}

/** Which sidebar categories must be expanded for `pathname` (the breadcrumb ancestors). */
export function expandedCategoryPaths(
  items: SidebarItem[],
  pathname: string
): Set<SidebarItem> {
  const set = new Set<SidebarItem>();
  const extract = (list: SidebarItem[]): boolean => {
    for (const item of list) {
      if (
        item.type === 'category' &&
        (isSamePath(item.href, pathname) || extract(item.items))
      ) {
        set.add(item);
        return true;
      }
      if (item.type === 'link' && isSamePath(item.href, pathname)) return true;
    }
    return false;
  };
  extract(items);
  return set;
}
