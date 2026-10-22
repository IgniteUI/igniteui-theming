/**
 * Builds the Sass a demo shows, as a value rather than a string.
 *
 * The snippets are small but they nest, and every branch — a family that needs a
 * `$gray` argument, a curve that is `null` rather than four numbers — used to be another
 * ternary inside a template literal. Composing values and formatting once keeps the
 * shape of the call readable and makes the output testable.
 */
export type Value =
  | { kind: "raw"; text: string }
  | { kind: "quoted"; text: string }
  | { kind: "list"; items: Value[] }
  | { kind: "map"; entries: Entry[] }
  | { kind: "call"; name: string; args: Entry[] };

export type Entry = [string, Value];

/**
 * A number, trimmed the way a person writes it: `1.04`, not `1.040`.
 *
 * Takes no precision argument on purpose. With one it is `Array.map`-shaped, and
 * `values.map(num)` then passes the index as the precision — which reads fine and
 * silently rounds the first element to zero decimals.
 */
export const num = (value: number): Value =>
  raw(String(Number(value.toFixed(3))));

/** A color, a number, an identifier, `null` — anything Sass reads literally. */
export const raw = (text: string | number): Value => ({
  kind: "raw",
  text: String(text),
});

/** A single-quoted string, as scale and family names are written. */
export const quoted = (text: string): Value => ({ kind: "quoted", text });

/** Space separated, the way a `range` is written. */
export const list = (...items: (string | number | Value)[]): Value => ({
  kind: "list",
  items: items.map((item) => (typeof item === "object" ? item : raw(item))),
});

export const map = (entries: Entry[]): Value => ({ kind: "map", entries });

export const call = (name: string, args: Entry[]): Value => ({
  kind: "call",
  name,
  args,
});

/** Entries whose value is absent are dropped, so a caller can compose without branching. */
export const entries = (source: Record<string, Value | undefined>): Entry[] =>
  Object.entries(source).filter(
    (entry): entry is Entry => entry[1] !== undefined,
  );

const WIDTH = 64;

const inline = (value: Value): string => {
  switch (value.kind) {
    case "raw":
      return value.text;
    case "quoted":
      return `'${value.text}'`;
    case "list":
      return value.items.map(inline).join(" ");
    case "map":
      return `(${value.entries.map(([key, item]) => `${key}: ${inline(item)}`).join(", ")})`;
    case "call":
      return `${value.name}(${value.args.map(([key, item]) => `${key}: ${inline(item)}`).join(", ")})`;
  }
};

/** Broken across lines only when the flat form will not fit. */
const format = (value: Value, depth: number): string => {
  if (value.kind !== "map" && value.kind !== "call") return inline(value);

  const flat = inline(value);

  if (flat.length + depth * 4 <= WIDTH) return flat;

  const group = value.kind === "map" ? value.entries : value.args;
  const pad = "    ".repeat(depth + 1);
  // A map keeps its trailing comma, the way they are usually written; an argument list
  // does not, because nobody writes one that way.
  const last = value.kind === "map" ? "," : "";
  const body = group
    .map(
      ([key, item], index) =>
        `${pad}${key}: ${format(item, depth + 1)}${index === group.length - 1 ? last : ","}`,
    )
    .join("\n");
  const close = "    ".repeat(depth);

  return value.kind === "map"
    ? `(\n${body}\n${close})`
    : `${value.name}(\n${body}\n${close})`;
};

/** A complete statement: `$name: <value>;` */
export const statement = (name: string, value: Value) =>
  `$${name}: ${format(value, 0)};`;
