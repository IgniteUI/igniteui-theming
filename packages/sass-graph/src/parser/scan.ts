/** Scans SCSS source without a full parser. */

/** Normalize a Sass identifier: `-` and `_` are interchangeable in Sass. */
export function normalizeName(name: string): string {
  return name.replace(/_/g, "-");
}

/**
 * Blanks comments and string contents with spaces, keeping newlines, quotes
 * and `#{…}` interpolations, so offsets and line numbers stay valid.
 * With `keepStrings`, only comments are blanked.
 */
export function sanitize(source: string, keepStrings = false): string {
  const out: string[] = [];
  const n = source.length;
  let i = 0;

  const blank = (ch: string) => (ch === "\n" ? "\n" : " ");

  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];

    // Line comment
    if (ch === "/" && next === "/") {
      while (i < n && source[i] !== "\n") {
        out.push(" ");
        i++;
      }
      continue;
    }

    // Block comment
    if (ch === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      for (; i < stop; i++) out.push(blank(source[i]));
      continue;
    }

    // String literal: keep the quotes and any interpolation, blank the rest.
    if ((ch === '"' || ch === "'") && keepStrings) {
      const end = closingQuote(source, i);
      for (; i < end; i++) out.push(source[i]);
      continue;
    }
    if (ch === '"' || ch === "'") {
      out.push(ch);
      i++;
      while (i < n && source[i] !== ch) {
        if (source[i] === "\\") {
          out.push(" ", blank(source[i + 1] ?? " "));
          i += 2;
          continue;
        }
        if (source[i] === "#" && source[i + 1] === "{") {
          let depth = 0;
          while (i < n) {
            const c = source[i];
            out.push(c);
            i++;
            if (c === "{") depth++;
            else if (c === "}" && --depth === 0) break;
          }
          continue;
        }
        out.push(blank(source[i]));
        i++;
      }
      if (i < n) {
        out.push(source[i]);
        i++;
      }
      continue;
    }

    out.push(ch);
    i++;
  }

  return out.join("");
}

/** Offset just past the quote that closes the string opened at `open`. */
function closingQuote(source: string, open: number): number {
  const quote = source[open];
  for (let i = open + 1; i < source.length; i++) {
    if (source[i] === "\\") i++;
    else if (source[i] === quote) return i + 1;
  }
  return source.length;
}

/** Source without comments and with whitespace collapsed, for comparing two versions of code. */
export function codeOf(source: string): string {
  return sanitize(source, true).replace(/\s+/g, " ").trim();
}

export interface Statement {
  /** Offset of the first non-whitespace character. */
  start: number;
  /** Offset just past the terminating `;` or `}`. */
  end: number;
  /** Offset of the opening `{` of the block, or -1 for plain statements. */
  blockStart: number;
}

/**
 * Split sanitized source into top-level statements: either `...;` or
 * `... { ... }`. Interpolation braces (`#{}`) do not open blocks.
 */
export function splitTopLevel(text: string): Statement[] {
  const statements: Statement[] = [];
  const stack: ("block" | "interp")[] = [];
  let start = -1;
  let blockStart = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (start === -1) {
      if (/\s/.test(ch) || ch === ";") continue;
      start = i;
      blockStart = -1;
    }

    if (ch === "#" && text[i + 1] === "{") {
      stack.push("interp");
      i++;
      continue;
    }

    if (ch === "{") {
      if (stack.length === 0) blockStart = i;
      stack.push("block");
      continue;
    }

    if (ch === "}") {
      const top = stack.pop();
      if (top === "block" && stack.length === 0) {
        statements.push({ start, end: i + 1, blockStart });
        start = -1;
      }
      continue;
    }

    if (ch === ";" && stack.length === 0) {
      statements.push({ start, end: i + 1, blockStart });
      start = -1;
    }
  }

  if (start !== -1) {
    statements.push({ start, end: text.length, blockStart });
  }

  return statements;
}

/** Find the index of the `)` matching the `(` at `open`. */
export function matchParen(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

/** Split a string on commas that are not nested in parentheses. */
export function splitTopLevelCommas(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/** Build a function that maps an offset to a 1-based line number. */
export function lineIndex(text: string): (offset: number) => number {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") starts.push(i + 1);
  }
  return (offset: number) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}
