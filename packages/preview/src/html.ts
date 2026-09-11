/** Minimal escaping template tag. Arrays join, `raw()` opts a value out of escaping. */
const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const marker = Symbol("raw");

export interface Raw {
  [marker]: string;
}

export const raw = (value: string): Raw => ({ [marker]: value });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ESCAPES[c]);

const stringifyValue = (value: unknown): string => {
  if (value == null || value === false) return "";
  if (Array.isArray(value)) return value.map(stringifyValue).join("");
  if (typeof value === "object" && marker in value)
    return (value as Raw)[marker];
  return escapeHtml(String(value));
};

export const html = (
  strings: TemplateStringsArray,
  ...values: unknown[]
): Raw =>
  raw(strings.reduce((out, s, i) => out + stringifyValue(values[i - 1]) + s));

export const stringify = (value: Raw) => value[marker];
