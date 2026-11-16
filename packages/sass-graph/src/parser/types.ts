export type SymbolKind = "variable" | "mixin" | "function";
export type NodeKind = SymbolKind | "module";

/** Edge types. Direction is always "from depends on to". */
export type EdgeType =
  | "uses-var"
  | "includes"
  | "calls"
  | "imports"
  | "forwards"
  /** A module re-exports a member through `@forward` (recorded only for `BuildOptions.reexportsFrom`). */
  | "re-exports";

export interface GraphNode {
  /** `<relFile>#<kind>:<name>` for symbols, `<relFile>#module` for files. */
  id: string;
  kind: NodeKind;
  name: string;
  /** Path relative to the parsed root, using forward slashes. */
  file: string;
  /** 1-based line of the declaration (1 for modules). */
  line: number;
  /** Folder of the file relative to root, e.g. `themes/components/button`. */
  folder: string;
  access: "public" | "private";
  group?: string;
  description?: string;
  params?: string[];
  /** Raw source of the declared value (variables only, truncated). */
  value?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface UnresolvedRef {
  from: string;
  ref: string;
}

export interface SassGraph {
  /** How the libraries that use the engine call it; absent when their repos were not scanned. */
  consumers?: import("../analysis/consumers.js").ConsumerUsage;
  root: string;
  generatedAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  unresolved: UnresolvedRef[];
}

/** A raw reference found in source, before resolution. */
export interface RawRef {
  kind: SymbolKind;
  name: string;
  namespace?: string;
}

export interface RawDeclaration {
  kind: SymbolKind;
  name: string;
  line: number;
  params?: string[];
  value?: string;
  doc: string[];
  refs: RawRef[];
  /** Source without comments, whitespace collapsed (see `codeOf`). */
  code: string;
}

export interface RawUse {
  url: string;
  /** `*` for global, otherwise the namespace. */
  namespace: string;
}

export interface RawForward {
  url: string;
  prefix?: string;
  show?: string[];
  hide?: string[];
}

export interface ParsedFile {
  file: string;
  uses: RawUse[];
  forwards: RawForward[];
  declarations: RawDeclaration[];
  /** References made by top-level code that is not a declaration. */
  moduleRefs: RawRef[];
  /** Top-level code that is not a declaration, including `@use`/`@forward`, without comments. */
  moduleCode: string;
}
