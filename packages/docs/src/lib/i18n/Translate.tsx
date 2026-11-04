// UI string translation (`<Translate>`, `translate()`, `interpolate()`).
import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from '../docs/config';
import { lookupMessage, pageLocale } from './locale';

type InterpolateValues = Record<string, ReactNode>;

function interpolateNodes(text: string, values?: InterpolateValues): ReactNode {
  if (!values) return text;
  const parts: ReactNode[] = [];
  const re = /\{(\w+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const value = values[match[1]!];
    parts.push(value === undefined ? match[0] : value);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  // Strings and numbers join into one string; only real React nodes need the array form.
  return parts.every((p) => typeof p === 'string' || typeof p === 'number')
    ? parts.join('')
    : parts;
}

export function interpolate(
  text: string,
  values?: Record<string, string | number>
): string {
  return String(interpolateNodes(text, values));
}

export interface Message {
  id?: string;
  message?: string;
  description?: string;
}

/** Translates a message. Server code must pass `locale`; in the browser it defaults to the page's `<html lang>`. */
export function translate(
  { id, message }: Message,
  values?: Record<string, string | number>,
  locale: Locale = pageLocale()
): string {
  const resolved = lookupMessage(id, message ?? id ?? '', locale);
  return interpolate(resolved, values);
}

/** `translate()` bound to one locale, for Astro components: `const t = translator(locale)`. */
export function translator(locale: Locale) {
  return (message: Message, values?: Record<string, string | number>) =>
    translate(message, values, locale);
}

const LocaleContext = createContext<Locale | undefined>(undefined);

/** Wraps a React island so `<Translate>` and `useLocale()` know the page locale while rendering on the server. */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}): ReactNode {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext) ?? pageLocale();
}

export interface TranslateProps {
  id?: string;
  description?: string;
  values?: InterpolateValues;
  children?: string;
}

export default function Translate({
  id,
  children,
  values,
}: TranslateProps): ReactNode {
  const locale = useLocale();
  const fallback = typeof children === 'string' ? children : (id ?? '');
  const resolved = lookupMessage(id, fallback, locale);
  return <>{interpolateNodes(resolved, values)}</>;
}
