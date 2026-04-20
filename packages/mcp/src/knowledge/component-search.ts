/**
 * Normalized, ranked component search engine.
 *
 * Matches user queries against component names, metadata aliases, and
 * platform selectors using order-independent token comparison, substring
 * fallback, and single-token typo recovery (Levenshtein distance ≤ 1).
 */

import type {
  ComponentMetadata,
  ComponentSelectors,
} from "./component-metadata.js";

interface NormalizedSearchTerm {
  /** Tokens concatenated without separators — used for substring matching (order-sensitive). */
  compact: string;
  /** Sorted, pipe-delimited unique tokens — used for order-independent set equality. */
  tokenSetKey: string;
  tokens: string[];
}

interface ComponentSearchEntry {
  name: string;
  signals: NormalizedSearchTerm[];
}

/** Options accepted by {@link createComponentSearcher}. */
export interface CreateComponentSearcherOptions {
  componentNames: string[];
  metadata: Record<string, ComponentMetadata>;
}

/** Pre-built search index with a single `search` method. */
export interface ComponentSearcher {
  search(query: string): string[];
}

/*
 * Prefix stripping happens in two complementary phases:
 *
 * 1. FRAMEWORK_PREFIX_PATTERN strips `igx-` / `igc-` (with hyphen) from the
 *    raw string before tokenisation — handles `igx-linear-bar` → `linear bar`.
 *
 * 2. stripFrameworkPrefixToken strips `igx` / `igc` (without hyphen) from
 *    individual tokens after splitting — handles `igxbutton` → `button` when
 *    no hyphen is present and the regex cannot match.
 */
const FRAMEWORK_PREFIX_PATTERN = /\big[cx]-/g;
const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/g;
const MIN_SEARCH_SCORE = 500;

function stripFrameworkPrefixToken(token: string): string {
  if (token.startsWith("igx") && token.length > 3) {
    return token.slice(3);
  }

  if (token.startsWith("igc") && token.length > 3) {
    return token.slice(3);
  }

  return token;
}

function normalizeSearchTerm(term: string): NormalizedSearchTerm | undefined {
  const lowerTerm = term.toLowerCase().trim();

  if (!lowerTerm) {
    return undefined;
  }

  const normalizedDelimiters = lowerTerm
    .replace(FRAMEWORK_PREFIX_PATTERN, "")
    .replace(NON_ALPHANUMERIC_PATTERN, " ")
    .trim();

  if (!normalizedDelimiters) {
    return undefined;
  }

  const tokens = normalizedDelimiters
    .split(/\s+/)
    .map(stripFrameworkPrefixToken)
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return undefined;
  }

  const uniqueTokens = [...new Set(tokens)];

  return {
    compact: tokens.join(""),
    tokenSetKey: uniqueTokens.slice().sort().join("|"),
    tokens: uniqueTokens,
  };
}

function getSelectorSearchSignals(selectors?: ComponentSelectors): string[] {
  if (!selectors) {
    return [];
  }

  const values = [selectors.angular, selectors.webcomponents];
  const signals: string[] = [];

  for (const value of values) {
    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      signals.push(...value);
      continue;
    }

    signals.push(value);
  }

  return signals;
}

function getComponentSearchSignals(
  componentName: string,
  metadataByName: Record<string, ComponentMetadata>,
): string[] {
  const metadata = metadataByName[componentName];
  const signals = new Set<string>([componentName]);

  if (!metadata) {
    return [...signals];
  }

  metadata.aliases?.forEach((alias) => {
    signals.add(alias);
  });

  getSelectorSearchSignals(metadata.selectors).forEach((selector) => {
    signals.add(selector);
  });

  return [...signals];
}

function buildComponentSearchIndex(
  searchableNames: string[],
  metadataByName: Record<string, ComponentMetadata>,
): ComponentSearchEntry[] {
  return searchableNames.map((name) => {
    const signals = getComponentSearchSignals(name, metadataByName)
      .map(normalizeSearchTerm)
      .filter((signal): signal is NormalizedSearchTerm => !!signal);

    return { name, signals };
  });
}

function getTokenCoverageScore(
  query: NormalizedSearchTerm,
  signal: NormalizedSearchTerm,
): number {
  if (query.tokens.length === 0 || signal.tokens.length === 0) {
    return 0;
  }

  const signalTokens = new Set(signal.tokens);
  let overlapCount = 0;

  for (const token of query.tokens) {
    if (signalTokens.has(token)) {
      overlapCount++;
    }
  }

  if (overlapCount === 0) {
    return 0;
  }

  const queryCoverage = overlapCount / query.tokens.length;
  const signalCoverage = overlapCount / signal.tokens.length;

  if (query.tokens.length === 1 && query.tokens[0].length < 4) {
    return queryCoverage === 1 && signalCoverage === 1 ? 900 : 0;
  }

  if (queryCoverage === 1) {
    return (
      800 +
      overlapCount * 10 -
      Math.max(0, signal.tokens.length - query.tokens.length)
    );
  }

  if (query.tokens.length > 1 && queryCoverage >= 0.5) {
    return 650 + Math.round(queryCoverage * 100 + signalCoverage * 50);
  }

  return 0;
}

function getSubstringFallbackScore(
  query: NormalizedSearchTerm,
  signal: NormalizedSearchTerm,
): number {
  if (query.compact.length < 4 || signal.compact.length === 0) {
    return 0;
  }

  if (signal.compact.includes(query.compact)) {
    return 500 + Math.min(query.compact.length, 100);
  }

  return 0;
}

function getEditDistanceWithinLimit(
  source: string,
  target: string,
  limit: number,
): number | undefined {
  if (source === target) {
    return 0;
  }

  const sourceLength = source.length;
  const targetLength = target.length;

  if (Math.abs(sourceLength - targetLength) > limit) {
    return undefined;
  }

  let previous = new Array<number>(targetLength + 1);
  let current = new Array<number>(targetLength + 1);

  for (let j = 0; j <= targetLength; j++) {
    previous[j] = j;
  }

  for (let i = 1; i <= sourceLength; i++) {
    current[0] = i;
    let rowMin = current[0];

    for (let j = 1; j <= targetLength; j++) {
      const substitutionCost = source[i - 1] === target[j - 1] ? 0 : 1;

      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost,
      );

      rowMin = Math.min(rowMin, current[j]);
    }

    if (rowMin > limit) {
      return undefined;
    }

    [previous, current] = [current, previous];
  }

  return previous[targetLength] <= limit ? previous[targetLength] : undefined;
}

function getTypoFallbackScore(
  query: NormalizedSearchTerm,
  signal: NormalizedSearchTerm,
): number {
  if (query.tokens.length !== 1) {
    return 0;
  }

  const [queryToken] = query.tokens;

  if (queryToken.length < 5) {
    return 0;
  }

  let bestScore = 0;

  for (const signalToken of signal.tokens) {
    if (signalToken.length < 5) {
      continue;
    }

    const distance = getEditDistanceWithinLimit(queryToken, signalToken, 1);

    if (distance === 1) {
      bestScore = Math.max(bestScore, 540);
    }
  }

  return bestScore;
}

function scoreSearchEntry(
  query: NormalizedSearchTerm,
  entry: ComponentSearchEntry,
): number {
  let bestScore = 0;

  for (const signal of entry.signals) {
    if (signal.compact === query.compact) {
      bestScore = Math.max(bestScore, 1000);
      continue;
    }

    if (signal.tokenSetKey === query.tokenSetKey) {
      bestScore = Math.max(bestScore, 900);
      continue;
    }

    bestScore = Math.max(bestScore, getTokenCoverageScore(query, signal));
    bestScore = Math.max(bestScore, getSubstringFallbackScore(query, signal));
    bestScore = Math.max(bestScore, getTypoFallbackScore(query, signal));
  }

  return bestScore;
}

/**
 * Build a pre-indexed component searcher from theme names and metadata.
 *
 * The returned searcher normalises queries, scores them against an
 * index of canonical names / aliases / selectors, and returns results
 * ranked by confidence (exact > token-set > overlap > substring > typo).
 */
export function createComponentSearcher(
  options: CreateComponentSearcherOptions,
): ComponentSearcher {
  const searchableNames = Array.from(
    new Set([...options.componentNames, ...Object.keys(options.metadata)]),
  ).sort((a, b) => a.localeCompare(b));

  const componentSearchIndex = buildComponentSearchIndex(
    searchableNames,
    options.metadata,
  );

  return {
    search(query: string): string[] {
      const normalizedQuery = normalizeSearchTerm(query);

      if (!normalizedQuery) {
        return [];
      }

      return componentSearchIndex
        .map((entry) => ({
          name: entry.name,
          score: scoreSearchEntry(normalizedQuery, entry),
        }))
        .filter((match) => match.score >= MIN_SEARCH_SCORE)
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .map((match) => match.name);
    },
  };
}
