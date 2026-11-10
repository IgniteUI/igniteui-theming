// the results list of the /search/ page, on Pagefind.
import { useEffect, useState, type ReactNode } from 'react';
import { translator } from '@/lib/i18n/Translate';
import { type Locale, VERSIONS } from '@/lib/docs/config';

/** Plural messages are `singular|plural`; pick the form for `count`. */
function plural(message: string, count: number): string {
  const forms = message.split('|');
  return (count === 1 ? forms[0] : forms[forms.length - 1]) ?? message;
}
import { loadPagefind, type PagefindResultData } from './pagefind';

export default function SearchResults({
  version: defaultVersion,
  locale,
}: {
  /** Version searched when the URL carries no (known) `?version=`. */
  version: string;
  locale: Locale;
}): ReactNode {
  const t = translator(locale);
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState(defaultVersion);
  const [results, setResults] = useState<PagefindResultData[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') ?? '';
    setQuery(q);
    // The navbar search appends `version` for non-latest docs.
    const v = params.get('version');
    if (v && v in VERSIONS) setVersion(v);
    const input = document.querySelector<HTMLInputElement>('input[name="q"]');
    if (input) {
      input.value = q;
      input.addEventListener('input', () => setQuery(input.value));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }
      const pagefind = await loadPagefind();
      if (!pagefind) return;
      const { results: raw } = await pagefind.search(query, {
        filters: { version },
      });
      const data = await Promise.all(raw.slice(0, 50).map((r) => r.data()));
      if (!cancelled) {
        setResults(data);
        const url = new URL(location.href);
        url.searchParams.set('q', query);
        history.replaceState(history.state, '', url);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [query, version]);

  if (!query.trim()) return null;
  if (results === null)
    return (
      <p>
        {t({
          id: 'theme.SearchPage.fetchingNewResults',
          message: 'Fetching new results...',
        })}
      </p>
    );
  if (results.length === 0)
    return (
      <p>
        {t({
          id: 'theme.SearchPage.noResultsText',
          message: 'No results were found',
        })}
      </p>
    );
  return (
    <>
      <p>
        {plural(
          t(
            {
              id: 'theme.SearchPage.documentsFound.plurals',
              message: 'One document found|{count} documents found',
            },
            { count: results.length }
          ),
          results.length
        )}
      </p>
      {results.map((r) => (
        <article
          key={r.url}
          className="it-search-page__result it-margin-bottom--lg"
        >
          <h2>
            <a href={r.url}>{r.meta.title ?? r.url}</a>
          </h2>
          <p dangerouslySetInnerHTML={{ __html: r.excerpt }} />
        </article>
      ))}
    </>
  );
}
