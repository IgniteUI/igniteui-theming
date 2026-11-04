// the navbar search on Pagefind (styles: `src/styles/components/_search.scss`): input + loading ring +
// ⌘K hint / clear button, and the autocomplete
// dropdown (dataset › suggestions › suggestion rows, footer "See all results" link, empty template).
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { translator } from '@/lib/i18n/Translate';
import {
  type Locale,
  localeBase,
  VERSIONS,
  type Version,
  versionPath,
} from '@/lib/docs/config';
import {
  iconAction,
  iconContent,
  iconHeading,
  iconNoResults,
  iconTitle,
  iconTreeInter,
  iconTreeLast,
} from './icons';
import {
  highlight,
  loadPagefind,
  searchHits,
  type Hit,
  type Pagefind,
} from './pagefind';

export interface SearchBarProps {
  /** Locale of the current page; the search page and fallback links stay in it. */
  locale: Locale;
  /** Docs version of the current page (`current` on non-doc pages); results are filtered to it. */
  version: string;
}

/** `version` arrives as a plain string from the layout; anything unknown falls back to the current docs. */
function knownVersion(version: string): Version {
  return version in VERSIONS ? (version as Version) : 'current';
}

function SuggestionRow({
  id,
  hit,
  query,
  active,
  onSelect,
  onHover,
}: {
  id: string;
  hit: Hit;
  query: string;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const tree = hit.isInterOfTree
    ? iconTreeInter
    : hit.isLastOfTree
      ? iconTreeLast
      : '';
  const icon =
    hit.type === 'title'
      ? iconTitle
      : hit.type === 'heading'
        ? iconHeading
        : iconContent;
  return (
    <div
      id={id}
      className={clsx('it-search__suggestion', {
        'it-search__suggestion--active': active,
      })}
      role="option"
      aria-selected={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      {tree && (
        <span className="it-search__hit-tree" dangerouslySetInnerHTML={{ __html: tree }} />
      )}
      <span className="it-search__hit-icon" dangerouslySetInnerHTML={{ __html: icon }} />
      <span className="it-search__hit-wrapper">
        <span
          className="it-search__hit-title"
          dangerouslySetInnerHTML={{ __html: highlight(hit.title, query) }}
        />
        {hit.type !== 'title' && (
          <span
            className="it-search__hit-path"
            dangerouslySetInnerHTML={{
              __html: highlight(hit.pageTitle, query),
            }}
          />
        )}
      </span>
      <span
        className="it-search__hit-action"
        dangerouslySetInnerHTML={{ __html: iconAction }}
      />
    </div>
  );
}

export default function SearchBar({
  locale,
  version,
}: SearchBarProps): ReactNode {
  const t = translator(locale);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pagefindRef = useRef<Pagefind | null>(null);
  const requestId = useRef(0);
  const filters = useMemo(() => ({ version }), [version]);

  const ensureIndex = useCallback(async () => {
    if (pagefindRef.current) return pagefindRef.current;
    setLoading(true);
    pagefindRef.current = await loadPagefind();
    setLoading(false);
    return pagefindRef.current;
  }, []);

  const runSearch = useCallback(
    async (query: string) => {
      const id = ++requestId.current;
      if (!query.trim()) {
        setHits(null);
        return;
      }
      const pagefind = await ensureIndex();
      if (!pagefind) return;
      const result = await searchHits(pagefind, query, filters);
      if (id === requestId.current) {
        setHits(result);
        setCursor(0);
      }
    },
    [ensureIndex, filters]
  );

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      )
        setFocused(false);
    };
    document.addEventListener('keydown', onShortcut);
    document.addEventListener('click', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onShortcut);
      document.removeEventListener('click', onClickOutside);
    };
  }, []);

  const go = (url: string) => {
    setFocused(false);
    inputRef.current?.blur();
    window.location.href = url;
  };
  // The search page lives under the locale, and a non-latest version travels along.
  const searchParams = new URLSearchParams({ q: value });
  if (knownVersion(version) !== 'current') searchParams.set('version', version);
  const searchPageUrl = `${localeBase(locale)}/search/?${searchParams}`;
  const coreConceptsUrl = `${versionPath(locale, knownVersion(version))}/core-concepts/colors/overview`;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!hits || hits.length === 0) {
      if (event.key === 'Enter' && value.trim()) go(searchPageUrl);
      if (event.key === 'Escape') setFocused(false);
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setCursor((c) => (c + 1) % hits.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setCursor((c) => (c - 1 + hits.length) % hits.length);
        break;
      case 'Enter':
        event.preventDefault();
        go(hits[cursor]!.url);
        break;
      case 'Escape':
        setFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  const open = focused && value.trim() !== '' && hits !== null;
  const empty = open && hits!.length === 0;

  return (
    <div
      ref={containerRef}
      style={{ width: focused ? '100%' : '9.56rem' }}
      className={clsx(
        'it-navbar__search',
        'it-search-bar',
        {
          'it-search-bar--loading': loading && value !== '',
          'it-navbar__search--focused': focused,
        }
      )}
      dir="ltr"
    >
      <span className="it-search-bar__inner">
        <input
          ref={inputRef}
          placeholder={t({
            id: 'theme.SearchBar.label',
            message: 'Search',
          })}
          aria-label="Search"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? 'it-search-menu' : undefined}
          aria-activedescendant={
            open && hits && hits.length > 0 ? `search-option-${cursor}` : undefined
          }
          className="it-navbar__search-input it-search-bar__input"
          autoComplete="off"
          value={value}
          onMouseEnter={() => void ensureIndex()}
          onFocus={() => {
            setFocused(true);
            void ensureIndex();
          }}
          onChange={(event) => {
            setValue(event.target.value);
            void runSearch(event.target.value);
          }}
          onKeyDown={onKeyDown}
        />
        {open && (
          <span id="it-search-menu" className="it-search__dropdown" role="listbox">
            <div className="it-search__dataset">
              {empty ? (
                <div className="it-search__empty">
                  <span className="it-search__no-results">
                    <span
                      className="it-search__no-results-icon"
                      dangerouslySetInnerHTML={{ __html: iconNoResults }}
                    />
                    <span className="it-search__no-results-text">
                      {t({
                        id: 'theme.SearchBar.noResultsText',
                        message: 'No results',
                      })}
                    </span>
                    <igc-button
                      class="it-outlined-button--style"
                      href={coreConceptsUrl}
                      variant="outlined"
                    >
                      {t({
                        id: 'theme.SearchBar.browseCoreConcepts',
                        message: 'Browse core concepts',
                      })}
                      <igc-icon slot="suffix" name="arrow"></igc-icon>
                    </igc-button>
                  </span>
                </div>
              ) : (
                <>
                  <div className="it-search__suggestions">
                    {hits!.map((hit, i) => (
                      <SuggestionRow
                        key={`${hit.url}-${i}`}
                        id={`search-option-${i}`}
                        hit={hit}
                        query={value}
                        active={i === cursor}
                        onSelect={() => go(hit.url)}
                        onHover={() => setCursor(i)}
                      />
                    ))}
                  </div>
                  <div className="it-search__footer">
                    <a
                      href={searchPageUrl}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {t({
                        id: 'theme.SearchBar.seeAll',
                        message: 'See all results',
                      })}
                    </a>
                  </div>
                </>
              )}
            </div>
          </span>
        )}
      </span>
      <div className="it-search-bar__loading">
        <div />
        <div />
        <div />
        <div />
      </div>
      {value !== '' && focused ? (
        <button
          type="button"
          className="it-navbar__search-clear-button"
          aria-label={t({
            id: 'theme.SearchBar.clearButtonTitle',
            message: 'Clear the query',
          })}
          onMouseDown={(event) => {
            event.preventDefault();
            setValue('');
            setHits(null);
          }}
        >
          ✕
        </button>
      ) : (
        // Always rendered; CSS shows it only on Apple platforms (`html[data-platform="mac"]`, set before first paint).
        value === '' && (
          <div className="it-search-bar__hints">
            <kbd className="it-search-bar__hint">⌘</kbd>
            <kbd className="it-search-bar__hint">K</kbd>
          </div>
        )
      )}
    </div>
  );
}
