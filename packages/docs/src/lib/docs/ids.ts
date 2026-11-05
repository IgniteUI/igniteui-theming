// doc id, slug and permalink rules.
import type { Locale, Version } from './config';
import { versionPath } from './config';
import { createExcerpt, parseContentTitle } from './markdown';
import type { DocMeta, DocSource } from './types';

const NUMBER_PREFIX_PATTERN =
  /^(?<numberPrefix>\d+)\s*[-_.]+\s*(?<suffix>[^-_.\s].*)$/;

/** `01-intro` → `{ filename: 'intro', numberPrefix: 1 }`; `intro` → `{ filename: 'intro' }`. */
export function parseNumberPrefix(filename: string): {
  filename: string;
  numberPrefix?: number;
} {
  const match = NUMBER_PREFIX_PATTERN.exec(filename);
  if (!match?.groups) return { filename };
  return {
    filename: match.groups.suffix!,
    numberPrefix: parseInt(match.groups.numberPrefix!, 10),
  };
}

export function stripNumberPrefix(str: string): string {
  return parseNumberPrefix(str).filename;
}

/** Strips number prefixes from every path segment. */
export function stripPathNumberPrefixes(p: string): string {
  return p.split('/').map(stripNumberPrefix).join('/');
}

/** Convention: `index`, `readme` or `<folder>/<folder>` docs are category indexes. */
export function isCategoryIndex(
  fileName: string,
  sourceDirName: string
): boolean {
  const directories =
    sourceDirName === '.' ? [] : sourceDirName.split('/').reverse();
  const eligible = ['index', 'readme', directories[0]?.toLowerCase()];
  return eligible.includes(fileName.toLowerCase());
}

/** `normalizeUrl`: joins parts with single slashes, keeping a trailing slash if the last part has one. */
export function normalizeUrl(parts: string[]): string {
  const joined = parts.filter(Boolean).join('/');
  const [protocol, rest] = joined.includes('://')
    ? joined.split('://')
    : ['', joined];
  const collapsed = rest.replace(/\/{2,}/g, '/');
  return protocol ? `${protocol}://${collapsed}` : collapsed;
}

function resolvePathname(to: string, from: string): string {
  return new URL(to, `http://x${from.endsWith('/') ? from : `${from}/`}`)
    .pathname;
}

function posixDirname(p: string): string {
  const i = p.lastIndexOf('/');
  return i === -1 ? '.' : p.slice(0, i);
}

function posixBasename(p: string): string {
  return p.slice(p.lastIndexOf('/') + 1);
}

/** Computes id, slug, permalink, title and description. */
export function getDocMeta(
  source: DocSource,
  locale: Locale,
  version: Version
): DocMeta {
  const { relativePath, frontmatter, body } = source;
  const sourceFileName = posixBasename(relativePath);
  const sourceDirName = posixDirname(relativePath);
  const withoutExt = sourceFileName.replace(/\.mdx?$/, '');
  const { filename: unprefixedFileName, numberPrefix } =
    parseNumberPrefix(withoutExt);
  const baseID = frontmatter.id ?? unprefixedFileName;
  if (baseID.includes('/')) {
    throw new Error(`Document id "${baseID}" cannot include slash.`);
  }
  const sidebarPosition = frontmatter.sidebar_position ?? numberPrefix;
  const dirIdPrefix =
    sourceDirName === '.' ? undefined : stripPathNumberPrefixes(sourceDirName);
  const id = [dirIdPrefix, baseID].filter(Boolean).join('/');

  const dirNameSlug =
    sourceDirName === '.' ? '/' : `/${stripPathNumberPrefixes(sourceDirName)}/`;
  let slug: string;
  if (frontmatter.slug?.startsWith('/')) {
    slug = frontmatter.slug;
  } else if (!frontmatter.slug && isCategoryIndex(withoutExt, sourceDirName)) {
    slug = dirNameSlug;
  } else {
    slug = resolvePathname(frontmatter.slug ?? baseID, dirNameSlug);
  }

  const contentTitle = parseContentTitle(body);
  const title = frontmatter.title ?? contentTitle ?? baseID;
  const description =
    frontmatter.description ?? createExcerpt(body.trim()) ?? '';
  const permalink = normalizeUrl([versionPath(locale, version), slug]);

  return {
    locale,
    version,
    id,
    slug,
    permalink,
    title,
    description,
    contentTitle,
    sidebarPosition,
    sourceDirName,
    sourceFileName,
    relativePath,
    frontmatter,
  };
}
