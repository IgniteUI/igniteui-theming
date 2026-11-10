import { describe, expect, it } from 'vitest';
import type { SidebarItem } from '../types';
import { combos, model, readSnapshot } from './helpers';

type Snapshot = Record<
  string,
  { docsSidebars: { DocsSidebar: SidebarItem[] } }
>;

describe('sidebar tree equals the snapshot', () => {
  const snapshot = readSnapshot<Snapshot>('sidebars.json');
  it.each(combos)('%s / %s', (locale, version) => {
    expect(model(locale, version).sidebar).toEqual(
      snapshot[`${locale}/${version}`]!.docsSidebars.DocsSidebar
    );
  });
});

describe('main doc', () => {
  it.each(combos)('%s / %s is getting-started/overview', (locale, version) => {
    expect(model(locale, version).mainDocId).toBe('getting-started/overview');
  });
});
