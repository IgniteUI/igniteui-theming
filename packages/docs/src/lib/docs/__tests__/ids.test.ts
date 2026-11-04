import { describe, expect, it } from 'vitest';
import {
  getDocMeta,
  isCategoryIndex,
  normalizeUrl,
  parseNumberPrefix,
} from '../ids';
import { combos, model, permalinkToFile, readSnapshot } from './helpers';

describe('id and slug rules', () => {
  it('parses number prefixes', () => {
    expect(parseNumberPrefix('01-intro')).toEqual({
      filename: 'intro',
      numberPrefix: 1,
    });
    expect(parseNumberPrefix('003 - my doc')).toEqual({
      filename: 'my doc',
      numberPrefix: 3,
    });
    expect(parseNumberPrefix('intro')).toEqual({ filename: 'intro' });
    expect(parseNumberPrefix('2024-report')).toEqual({
      filename: 'report',
      numberPrefix: 2024,
    });
  });

  it('detects category index docs', () => {
    expect(isCategoryIndex('index', 'a/b')).toBe(true);
    expect(isCategoryIndex('README', 'a/b')).toBe(true);
    expect(isCategoryIndex('bem', 'utility-concepts/bem')).toBe(true);
    expect(isCategoryIndex('overview', 'core-concepts/colors')).toBe(false);
  });

  it('normalizes urls keeping the trailing slash of the last part', () => {
    expect(normalizeUrl(['/theming-docs/docs', '/utility-concepts/bem/'])).toBe(
      '/theming-docs/docs/utility-concepts/bem/'
    );
    expect(normalizeUrl(['/theming-docs/', '/docs/24.0.0', '/x'])).toBe(
      '/theming-docs/docs/24.0.0/x'
    );
  });

  it('computes id, slug and permalink for a folder-named index doc', () => {
    const meta = getDocMeta(
      {
        relativePath: 'utility-concepts/bem/bem.mdx',
        frontmatter: { sidebar_position: 1 },
        body: '# Overview\n\nBEM text.',
      },
      'en',
      'current'
    );
    expect(meta.id).toBe('utility-concepts/bem/bem');
    expect(meta.slug).toBe('/utility-concepts/bem/');
    expect(meta.permalink).toBe('/theming-docs/docs/utility-concepts/bem/');
    expect(meta.title).toBe('Overview');
    expect(meta.description).toBe('BEM text.');
  });

  it('honours frontmatter id and slug', () => {
    const meta = getDocMeta(
      {
        relativePath: '01-guides/02-foo.md',
        frontmatter: { id: 'bar', slug: '../baz' },
        body: 'x',
      },
      'ja',
      '24.0.0'
    );
    expect(meta.id).toBe('guides/bar');
    expect(meta.slug).toBe('/baz');
    expect(meta.permalink).toBe('/theming-docs/ja/docs/24.0.0/baz');
    expect(meta.sidebarPosition).toBe(2);
  });
});

describe('routes match the snapshot', () => {
  const snapshot = readSnapshot<{ routes: string[] }>('routes.json');
  const docRoutes = snapshot.routes.filter((r) => r.includes('/docs/'));

  it('generates exactly the snapshot doc routes', () => {
    const generated = combos
      .flatMap(([l, v]) =>
        model(l, v).docs.map((d) => permalinkToFile(d.permalink))
      )
      .sort();
    expect(generated).toEqual(docRoutes);
  });
});

describe('titles and descriptions match the snapshot', () => {
  type Snapshot = Record<
    string,
    { docs: Record<string, { id: string; title: string; description: string }> }
  >;
  const snapshot = readSnapshot<Snapshot>('sidebars.json');

  it.each(combos)('%s / %s', (locale, version) => {
    const m = model(locale, version);
    const expected = snapshot[`${locale}/${version}`]!.docs;
    const actual = Object.fromEntries(
      m.docs.map((d) => [
        d.id,
        { id: d.id, title: d.title, description: d.description },
      ])
    );
    const expectedStripped = Object.fromEntries(
      Object.values(expected).map((d) => [
        d.id,
        { id: d.id, title: d.title, description: d.description },
      ])
    );
    expect(actual).toEqual(expectedStripped);
  });
});
