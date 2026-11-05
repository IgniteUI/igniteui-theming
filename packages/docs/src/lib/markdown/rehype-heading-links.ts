// heading markup on h2–h6 (the `it-anchor` class and the
// `.hash-link` direct link), and collects the h2 entries for the TOC with their inner HTML (so `<code>` in a
// heading shows in the TOC). The list is exposed as `remarkPluginFrontmatter.toc`.
import type { Element, Root } from 'hast';
import { toHtml } from 'hast-util-to-html';
import { toString } from 'hast-util-to-string';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

export interface TocItem {
  id: string;
  level: number;
  /** Inner HTML of the heading, without the hash link. */
  value: string;
}

const rehypeHeadingLinks: Plugin<
  [{ minLevel?: number; maxLevel?: number }?],
  Root
> = (options = {}) => {
  const minLevel = options.minLevel ?? 2;
  const maxLevel = options.maxLevel ?? 2;
  return (tree, file) => {
    const toc: TocItem[] = [];
    visit(tree, 'element', (node: Element) => {
      const match = /^h([1-6])$/.exec(node.tagName);
      if (!match) return;
      const level = Number(match[1]);
      const id = node.properties?.id;
      if (level === 1 || typeof id !== 'string' || !id) return;
      if (level >= minLevel && level <= maxLevel) {
        // MDX expression/JSX nodes cannot be serialised; they never carry TOC text anyway.
        const serialisable = node.children.filter(
          (c) => !String(c.type).startsWith('mdx')
        );
        toc.push({
          id,
          level,
          value: toHtml(serialisable as Element['children']),
        });
      }
      const label = `Direct link to ${toString(node)}`;
      node.properties.className = [
        'it-anchor',
        'it-anchor',
        ...toClassList(node.properties.className),
      ];
      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: {
          href: `#${id}`,
          className: ['it-hash-link'],
          ariaLabel: label,
          title: label,
          translate: 'no',
          // keeps the zero-width space out of Pagefind's heading titles
          dataPagefindIgnore: '',
        },
        children: [{ type: 'text', value: '​' }],
      });
    });
    const data = file.data as {
      astro?: { frontmatter?: Record<string, unknown> };
    };
    data.astro ??= {};
    data.astro.frontmatter ??= {};
    data.astro.frontmatter.toc = toc;
  };
};

function toClassList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  return [];
}

export default rehypeHeadingLinks;
