// map a doc (or any page path) to its counterpart in another version or locale.
import { localeBase, type Locale } from './config';
import type { DocsModel } from './model';

/** Same doc in `target` version (same locale), else that version's entry doc (the version dropdown's target). */
export function versionCounterpart(
  docId: string | undefined,
  target: DocsModel
): string {
  const doc = docId ? target.byId.get(docId) : undefined;
  return (doc ?? target.byId.get(target.mainDocId)!).permalink;
}

/** Same doc in `target` locale (same version), else that locale's entry doc. */
export function localeCounterpart(
  docId: string | undefined,
  target: DocsModel
): string {
  return versionCounterpart(docId, target);
}

/** For non-doc pages (landing, 404, search): swap the locale prefix, keeping the rest of the path. */
export function localePathCounterpart(
  pathname: string,
  from: Locale,
  to: Locale
): string {
  const fromBase = localeBase(from);
  const rest = pathname.startsWith(fromBase)
    ? pathname.slice(fromBase.length)
    : pathname;
  return `${localeBase(to)}${rest || '/'}`;
}
