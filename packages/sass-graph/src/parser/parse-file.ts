import {
  codeOf,
  lineIndex,
  matchParen,
  normalizeName,
  sanitize,
  splitTopLevel,
  splitTopLevelCommas,
} from "./scan.js";
import type {
  ParsedFile,
  RawDeclaration,
  RawForward,
  RawRef,
  RawUse,
} from "./types.js";

const IDENT = "[a-zA-Z_-][\\w-]*";

/** Names bound inside a block: assignments, `@each`/`@for` loop variables. */
function collectLocals(text: string, locals: Set<string>): void {
  // Only `$x:` at the start of a statement assigns; `f($x: …)` is a keyword argument.
  for (const m of text.matchAll(
    new RegExp(
      `(?:^|[;{}])\\s*\\$(${IDENT})\\s*:((?:#\\{[^}]*\\}|[^;{}])*)`,
      "g",
    ),
  )) {
    // `!global` writes the module variable, so it does not shadow it.
    if (/!global\b/.test(m[2])) continue;
    locals.add(normalizeName(m[1]));
  }
  for (const m of text.matchAll(/@each\s+([^{]*?)\s+in\b/g)) {
    for (const v of m[1].matchAll(new RegExp(`\\$(${IDENT})`, "g"))) {
      locals.add(normalizeName(v[1]));
    }
  }
  for (const m of text.matchAll(new RegExp(`@for\\s+\\$(${IDENT})`, "g"))) {
    locals.add(normalizeName(m[1]));
  }
}

/**
 * Find references to variables, mixins and functions in sanitized text.
 * Unnamespaced variable references that are local are dropped.
 */
export function findRefs(text: string, locals: Set<string>): RawRef[] {
  const refs: RawRef[] = [];
  const seen = new Set<string>();
  const add = (ref: RawRef) => {
    const key = `${ref.kind}:${ref.namespace ?? ""}.${ref.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push(ref);
    }
  };

  // @include [ns.]mixin
  for (const m of text.matchAll(
    new RegExp(`@include\\s+(?:(${IDENT})\\.)?(${IDENT})`, "g"),
  )) {
    add({ kind: "mixin", namespace: m[1], name: normalizeName(m[2]) });
  }

  // [ns.]$variable — skip `$x:` (assignment or keyword argument).
  for (const m of text.matchAll(
    new RegExp(`(?:(${IDENT})\\.)?\\$(${IDENT})(\\s*:)?`, "g"),
  )) {
    const [, ns, rawName, colon] = m;
    if (colon && !ns) continue;
    const name = normalizeName(rawName);
    if (!ns && locals.has(name)) continue;
    add({ kind: "variable", namespace: ns, name });
  }

  // [ns.]function( — blank out @include/@mixin/@function headers first so
  // their names are not mistaken for calls.
  const callable = text.replace(
    new RegExp(`@(include|mixin|function)\\s+(?:${IDENT}\\.)?${IDENT}`, "g"),
    (s) => " ".repeat(s.length),
  );
  for (const m of callable.matchAll(
    new RegExp(`(?<![\\w$@.#-])(?:(${IDENT})\\.)?(${IDENT})\\(`, "g"),
  )) {
    add({ kind: "function", namespace: m[1], name: normalizeName(m[2]) });
  }

  return refs;
}

function parseParams(header: string): {
  params: string[];
  defaults: string;
  end: number;
} {
  const open = header.indexOf("(");
  if (open === -1) return { params: [], defaults: "", end: -1 };
  const close = matchParen(header, open);
  const inner = header.slice(open + 1, close === -1 ? undefined : close);
  const params: string[] = [];
  let defaults = "";
  for (const part of splitTopLevelCommas(inner)) {
    const m = part.match(
      new RegExp(`\\$(${IDENT})(\\.\\.\\.)?\\s*(?::(.*))?`, "s"),
    );
    if (!m) continue;
    params.push(`$${normalizeName(m[1])}${m[2] ?? ""}`);
    if (m[3]) defaults += ` ${m[3]}`;
  }
  return { params, defaults, end: close };
}

/** Collect the contiguous `///` sassdoc lines directly above `line`. */
function docAbove(lines: string[], line: number): string[] {
  const doc: string[] = [];
  for (let i = line - 2; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("///") && !trimmed.startsWith("////")) {
      doc.unshift(trimmed.replace(/^\/\/\/ ?/, ""));
    } else {
      break;
    }
  }
  return doc;
}

/** Extract the URL and trailing clauses from a raw `@use`/`@forward`. */
function parseModuleRule(raw: string): { url: string; rest: string } | null {
  const m = raw.match(/^@(?:use|forward)\s+(['"])(.*?)\1([\s\S]*)$/);
  if (!m) return null;
  // Drop a `with (...)` configuration clause.
  const rest = m[3].replace(/\bwith\s*\([\s\S]*$/, "").replace(/;\s*$/, "");
  return { url: m[2], rest: rest.trim() };
}

function defaultNamespace(url: string): string {
  const clean = url.replace(/\/+$/, "");
  const last = clean.slice(clean.lastIndexOf("/") + 1).replace(/^sass:/, "");
  return normalizeName(last.replace(/\.s?css$/, "").replace(/^_/, ""));
}

function parseUse(raw: string): RawUse | null {
  const parsed = parseModuleRule(raw);
  if (!parsed) return null;
  const as = parsed.rest.match(/\bas\s+(\*|[\w-]+)/);
  return {
    url: parsed.url,
    namespace: as ? normalizeName(as[1]) : defaultNamespace(parsed.url),
  };
}

function parseForward(raw: string): RawForward | null {
  const parsed = parseModuleRule(raw);
  if (!parsed) return null;
  const forward: RawForward = { url: parsed.url };
  const as = parsed.rest.match(/\bas\s+([\w-]+)\*/);
  if (as) forward.prefix = normalizeName(as[1]);
  const list = (kw: string) => {
    const m = parsed.rest.match(new RegExp(`\\b${kw}\\s+(.+)$`));
    return m
      ? m[1].split(",").map((s) => {
          const t = s.trim();
          return t.startsWith("$")
            ? `$${normalizeName(t.slice(1))}`
            : normalizeName(t);
        })
      : undefined;
  };
  forward.show = list("show");
  forward.hide = list("hide");
  return forward;
}

/** Parse a single SCSS file into raw declarations, references and modules. */
export function parseFile(file: string, source: string): ParsedFile {
  const clean = sanitize(source);
  const toLine = lineIndex(source);
  const lines = source.split("\n");

  const result: ParsedFile = {
    file,
    uses: [],
    forwards: [],
    declarations: [],
    moduleRefs: [],
    moduleCode: "",
  };
  const moduleText: string[] = [];
  const moduleRaw: string[] = [];

  for (const stmt of splitTopLevel(clean)) {
    const text = clean.slice(stmt.start, stmt.end);
    const raw = source.slice(stmt.start, stmt.end);
    const line = toLine(stmt.start);

    // `with(...)` values of `@use`/`@forward` are top-level references.
    const configured = text.match(
      /^@(?:use|forward)\b[\s\S]*?\bwith\s*(\([\s\S]*)$/,
    );
    if (configured) moduleText.push(configured[1]);

    if (text.startsWith("@use")) {
      moduleRaw.push(raw);
      const use = parseUse(raw);
      if (use) result.uses.push(use);
      continue;
    }

    if (text.startsWith("@forward")) {
      moduleRaw.push(raw);
      const forward = parseForward(raw);
      if (forward) result.forwards.push(forward);
      continue;
    }

    const callable = text.match(new RegExp(`^@(mixin|function)\\s+(${IDENT})`));
    if (callable && stmt.blockStart !== -1) {
      const kind = callable[1] as "mixin" | "function";
      const header = text.slice(0, stmt.blockStart - stmt.start);
      const body = text.slice(stmt.blockStart - stmt.start);
      const { params, defaults } = parseParams(
        header.slice(callable[0].length),
      );
      const locals = new Set(
        params.map((p) => p.slice(1).replace(/\.\.\.$/, "")),
      );
      collectLocals(body, locals);
      result.declarations.push({
        kind,
        name: normalizeName(callable[2]),
        line,
        params,
        doc: docAbove(lines, line),
        refs: findRefs(`${defaults}\n${body}`, locals),
        code: codeOf(raw),
      });
      continue;
    }

    const variable = text.match(new RegExp(`^\\$(${IDENT})\\s*:`));
    if (variable) {
      const valueText = text.slice(variable[0].length);
      const rawValue = raw
        .slice(variable[0].length)
        .replace(/;\s*$/, "")
        .trim();
      const decl: RawDeclaration = {
        kind: "variable",
        name: normalizeName(variable[1]),
        line,
        value: rawValue.length > 400 ? `${rawValue.slice(0, 400)}…` : rawValue,
        doc: docAbove(lines, line),
        refs: findRefs(valueText, new Set()),
        code: codeOf(raw),
      };
      result.declarations.push(decl);
      continue;
    }

    moduleText.push(text);
    moduleRaw.push(raw);
  }

  result.moduleCode = codeOf(moduleRaw.join("\n"));

  if (moduleText.length) {
    const joined = moduleText.join("\n");
    const locals = new Set<string>();
    // Only loop variables and assignments nested in blocks are local; top-level
    // `$x:` statements were already turned into declarations above.
    collectLocals(joined, locals);
    result.moduleRefs = findRefs(joined, locals);
  }

  return result;
}
