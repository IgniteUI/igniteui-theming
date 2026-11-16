import { parseFile } from "./parse-file.js";
import type {
  EdgeType,
  GraphEdge,
  GraphNode,
  ParsedFile,
  RawForward,
  RawRef,
  SassGraph,
  SymbolKind,
  UnresolvedRef,
} from "./types.js";

/** `kind:name` → node id. */
type Members = Map<string, string>;

const EDGE_FOR_KIND: Record<SymbolKind, EdgeType> = {
  variable: "uses-var",
  mixin: "includes",
  function: "calls",
};

const memberKey = (kind: SymbolKind, name: string) => `${kind}:${name}`;

export const moduleId = (file: string) => `${file}#module`;
export const symbolId = (file: string, kind: SymbolKind, name: string) =>
  `${file}#${kind}:${name}`;

function dirname(file: string): string {
  const i = file.lastIndexOf("/");
  return i === -1 ? "" : file.slice(0, i);
}

function joinPath(base: string, rel: string): string {
  const parts = base ? base.split("/") : [];
  for (const seg of rel.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

export interface BuildOptions {
  /** Maps a package URL (`igniteui-theming/sass/x`) to a path in `sources`, or returns undefined. */
  alias?: (url: string) => string | undefined;
  /** Files whose `@forward`s get a `re-exports` edge per forwarded member. */
  reexportsFrom?: (file: string) => boolean;
  /** Files whose unresolved references are recorded; all by default. */
  reportUnresolved?: (file: string) => boolean;
}

/** Resolve a `@use`/`@forward` URL to a file in `files`, Sass-style. */
export function resolveUrl(
  from: string,
  url: string,
  files: Set<string>,
  alias?: BuildOptions["alias"],
): string | null {
  if (url.startsWith("sass:")) return null;
  const aliased = alias?.(url);
  const target = aliased ?? joinPath(dirname(from), url.replace(/\.scss$/, ""));
  const dir = dirname(target);
  const base = target.slice(dir.length ? dir.length + 1 : 0);
  const prefix = dir ? `${dir}/` : "";
  const candidates = url.endsWith("/")
    ? [`${target}/_index.scss`, `${target}/index.scss`]
    : [
        `${prefix}${base}.scss`,
        `${prefix}_${base}.scss`,
        `${target}/_index.scss`,
        `${target}/index.scss`,
      ];
  return candidates.find((c) => files.has(c)) ?? null;
}

interface Doc {
  description?: string;
  group?: string;
  access?: string;
}

function readDoc(lines: string[]): Doc {
  const doc: Doc = {};
  const description: string[] = [];
  let inTags = false;
  for (const line of lines) {
    const tag = line.match(/^@(\w+)\s*(.*)$/);
    if (tag) {
      inTags = true;
      if (tag[1] === "group") doc.group = tag[2].trim();
      if (tag[1] === "access") doc.access = tag[2].trim();
      continue;
    }
    if (!inTags) description.push(line);
  }
  const text = description.join(" ").replace(/\s+/g, " ").trim();
  if (text) doc.description = text;
  return doc;
}

/** File-level sassdoc poster (`////` block) defaults. */
function readPoster(source: string): Doc {
  const m = source.match(/^\s*\/{4}\s*\n([\s\S]*?)\n\s*\/{4}/m);
  if (!m) return {};
  return readDoc(
    m[1]
      .split("\n")
      .map((l) => l.trim().replace(/^\/\/\/ ?/, ""))
      .filter(Boolean),
  );
}

/**
 * Build a dependency graph from a map of `relative path → source`.
 * Paths must use forward slashes and include the `.scss` extension.
 */
export function buildGraph(
  sources: Map<string, string>,
  root = "",
  options: BuildOptions = {},
): SassGraph {
  const fileSet = new Set(sources.keys());
  const resolveIn = (from: string, url: string) =>
    resolveUrl(from, url, fileSet, options.alias);
  const parsed = new Map<string, ParsedFile>();
  const nodes: GraphNode[] = [];
  const nodeIds = new Set<string>();

  for (const [file, source] of sources) {
    const pf = parseFile(file, source);
    parsed.set(file, pf);
    const folder = dirname(file);
    const poster = readPoster(source);

    nodes.push({
      id: moduleId(file),
      kind: "module",
      name: file.slice(folder.length ? folder.length + 1 : 0),
      file,
      line: 1,
      folder,
      access: "public",
      group: poster.group,
    });

    for (const decl of pf.declarations) {
      const id = symbolId(file, decl.kind, decl.name);
      if (nodeIds.has(id)) continue; // re-assignment of the same variable
      nodeIds.add(id);
      const doc = readDoc(decl.doc);
      const isPrivate =
        decl.name.startsWith("-") ||
        (doc.access ?? poster.access) === "private";
      nodes.push({
        id,
        kind: decl.kind,
        name: decl.name,
        file,
        line: decl.line,
        folder,
        access: isPrivate ? "private" : "public",
        group: doc.group ?? poster.group,
        description: doc.description,
        params: decl.params,
        value: decl.value,
      });
    }
  }

  /** Members one `@forward` passes on: prefix first, then show/hide on the prefixed names, as in Sass. */
  const forwarded = (fw: RawForward, source: Members): Members => {
    const out: Members = new Map();
    for (const [key, id] of source) {
      const [kind, name] = key.split(/:(.*)/s) as [SymbolKind, string];
      const finalName = fw.prefix ? `${fw.prefix}${name}` : name;
      const listed = kind === "variable" ? `$${finalName}` : finalName;
      if (fw.show && !fw.show.includes(listed)) continue;
      if (fw.hide?.includes(listed)) continue;
      out.set(memberKey(kind, finalName), id);
    }
    return out;
  };

  // --- Exports (own public members + forwarded members) -------------------
  const exportsCache = new Map<string, Members>();
  const exportsOf = (file: string, visiting = new Set<string>()): Members => {
    const cached = exportsCache.get(file);
    if (cached) return cached;
    const members: Members = new Map();
    if (visiting.has(file)) return members;
    visiting.add(file);
    const pf = parsed.get(file);
    if (!pf) return members;

    for (const decl of pf.declarations) {
      // Sass module privacy is name-based: `-x` / `_x` members are hidden.
      if (decl.name.startsWith("-")) continue;
      members.set(
        memberKey(decl.kind, decl.name),
        symbolId(file, decl.kind, decl.name),
      );
    }

    for (const fw of pf.forwards) {
      const target = resolveIn(file, fw.url);
      if (!target) continue;
      for (const [finalKey, id] of forwarded(fw, exportsOf(target, visiting))) {
        if (!members.has(finalKey)) members.set(finalKey, id);
      }
    }

    visiting.delete(file);
    exportsCache.set(file, members);
    return members;
  };

  // --- Edges ------------------------------------------------------------------
  const edges: GraphEdge[] = [];
  const edgeKeys = new Set<string>();
  const unresolved: UnresolvedRef[] = [];
  const addEdge = (from: string, to: string, type: EdgeType) => {
    if (from === to) return;
    const key = `${from}>${to}>${type}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ from, to, type });
  };

  for (const [file, pf] of parsed) {
    const report = options.reportUnresolved?.(file) ?? true;
    const miss = (ref: UnresolvedRef) => {
      if (report) unresolved.push(ref);
    };
    const scope: Members = new Map();
    const namespaces = new Map<string, Members | "builtin">();

    for (const use of pf.uses) {
      if (use.url.startsWith("sass:")) {
        namespaces.set(use.namespace, "builtin");
        continue;
      }
      const target = resolveIn(file, use.url);
      if (!target) {
        miss({ from: moduleId(file), ref: `@use '${use.url}'` });
        continue;
      }
      addEdge(moduleId(file), moduleId(target), "imports");
      const members = exportsOf(target);
      if (use.namespace === "*") {
        for (const [k, v] of members) if (!scope.has(k)) scope.set(k, v);
      } else {
        namespaces.set(use.namespace, members);
      }
    }

    for (const fw of pf.forwards) {
      const target = resolveIn(file, fw.url);
      if (!target) {
        miss({ from: moduleId(file), ref: `@forward '${fw.url}'` });
        continue;
      }
      addEdge(moduleId(file), moduleId(target), "forwards");
      if (options.reexportsFrom?.(file)) {
        for (const id of forwarded(fw, exportsOf(target)).values()) {
          addEdge(moduleId(file), id, "re-exports");
        }
      }
    }

    // Own declarations shadow imported members.
    for (const decl of pf.declarations) {
      scope.set(
        memberKey(decl.kind, decl.name),
        symbolId(file, decl.kind, decl.name),
      );
    }

    const resolve = (from: string, ref: RawRef) => {
      const key = memberKey(ref.kind, ref.name);
      const label = `${ref.namespace ? `${ref.namespace}.` : ""}${
        ref.kind === "variable" ? "$" : ""
      }${ref.name}${ref.kind === "function" ? "()" : ""}`;

      if (ref.namespace) {
        const ns = namespaces.get(ref.namespace);
        if (ns === "builtin") return;
        const target = ns?.get(key);
        if (target) addEdge(from, target, EDGE_FOR_KIND[ref.kind]);
        else miss({ from, ref: label });
        return;
      }

      const target = scope.get(key);
      if (target) {
        addEdge(from, target, EDGE_FOR_KIND[ref.kind]);
      } else if (ref.kind !== "function") {
        // Unknown bare functions are plain CSS / Sass globals (rgb, var, if…).
        miss({ from, ref: label });
      }
    };

    for (const decl of pf.declarations) {
      const from = symbolId(file, decl.kind, decl.name);
      for (const ref of decl.refs) resolve(from, ref);
    }
    for (const ref of pf.moduleRefs) resolve(moduleId(file), ref);
  }

  return {
    root,
    generatedAt: new Date().toISOString(),
    nodes,
    edges,
    unresolved,
  };
}
