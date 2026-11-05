import { describe, expect, it } from 'vitest';
import { combos, model, permalinkToFile, readSnapshot } from './helpers';
import { localePathCounterpart, versionCounterpart } from '../versions';

interface NavPage {
  prev: { href: string; label: string } | null;
  next: { href: string; label: string } | null;
  breadcrumbs: { href: string | null; label: string }[];
  title: string;
}

describe('previous/next and breadcrumbs match the snapshot', () => {
  const snapshot = readSnapshot<{ pages: Record<string, NavPage> }>('nav.json');

  it.each(combos)('%s / %s', (locale, version) => {
    const m = model(locale, version);
    for (const doc of m.docs) {
      const expected = snapshot.pages[permalinkToFile(doc.permalink)];
      expect(expected, doc.permalink).toBeDefined();
      const { previous, next } = m.navigation(doc);
      const actual = {
        prev: previous
          ? { href: previous.permalink, label: previous.title }
          : null,
        next: next ? { href: next.permalink, label: next.title } : null,
        breadcrumbs: [
          { href: null, label: '' },
          ...m
            .breadcrumbs(doc)
            .map((c) => ({ href: c.href ?? null, label: c.label })),
        ],
        title: `${doc.title} | Ignite UI Theming`,
      };
      expect(actual, doc.permalink).toEqual(expected!);
    }
  });
});

describe('version and locale counterparts', () => {
  it('maps to the same doc when it exists and to the entry doc otherwise', () => {
    const v24 = model('en', '24.0.0');
    expect(versionCounterpart('core-concepts/colors/scoping', v24)).toBe(
      '/theming-docs/docs/24.0.0/core-concepts/colors/scoping'
    );
    expect(versionCounterpart('styling-with-ai/overview', v24)).toBe(
      '/theming-docs/docs/24.0.0/getting-started/overview'
    );
    expect(versionCounterpart(undefined, model('ja', 'current'))).toBe(
      '/theming-docs/ja/docs/getting-started/overview'
    );
  });
  it('swaps the locale prefix on non-doc paths', () => {
    expect(localePathCounterpart('/theming-docs/', 'en', 'ja')).toBe(
      '/theming-docs/ja/'
    );
    expect(localePathCounterpart('/theming-docs/ja/search', 'ja', 'en')).toBe(
      '/theming-docs/search'
    );
  });
});
