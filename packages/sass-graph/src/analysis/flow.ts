import {
  type Filters,
  type GraphModel,
  search,
  visibleNeighbours,
} from "../graph/model.js";
import { normalizeName } from "../parser/scan.js";
import type { GraphNode, NodeKind } from "../parser/types.js";
import { label } from "./systems.js";

export interface FlowNode {
  node: GraphNode;
  children: FlowNode[];
  /** Expanded at another place in the tree; its children are not repeated here. */
  repeated: boolean;
  /** Links hidden because the depth limit was reached. */
  cut: number;
  /** The link from the parent passes through nodes hidden by the filters. */
  indirect: boolean;
}

export interface FlowOptions {
  /** `dependencies`: what the symbol is built from. `dependents`: what uses it. */
  direction: "dependencies" | "dependents";
  depth: number;
  mixins: boolean;
  functions: boolean;
  variables: boolean;
  files: boolean;
}

export const DEFAULT_FLOW: FlowOptions = {
  direction: "dependencies",
  depth: 4,
  variables: false,
  mixins: true,
  functions: true,
  files: false,
};

export class SymbolLookupError extends Error {}

const KIND_PREFIXES: Record<string, NodeKind> = {
  mixin: "mixin",
  function: "function",
  fn: "function",
  variable: "variable",
  var: "variable",
};

/**
 * Finds one symbol by id (`file#kind:name`), `kind:name`, `$name`, `name()` or
 * `name`. Throws a `SymbolLookupError` that lists the candidates when the
 * query matches none or several.
 */
export function resolveSymbol(model: GraphModel, query: string): GraphNode {
  const q = query.trim();
  const byId = model.byId.get(q);
  if (byId) return byId;

  let kind: NodeKind | undefined;
  let name = q;
  const prefixed = q.match(/^(\w+):(.+)$/);
  if (prefixed && KIND_PREFIXES[prefixed[1]]) {
    kind = KIND_PREFIXES[prefixed[1]];
    name = prefixed[2];
  }
  if (name.startsWith("$")) {
    kind = "variable";
    name = name.slice(1);
  } else if (name.endsWith("()")) {
    name = name.slice(0, -2);
  }
  name = normalizeName(name);

  const named = model.graph.nodes.filter(
    (n) => n.kind !== "module" && n.name === name,
  );
  // A bare name means a mixin or function unless only variables have it.
  const callable = named.filter((n) => n.kind !== "variable");
  const matches = kind
    ? named.filter((n) => n.kind === kind)
    : callable.length || q.endsWith("()")
      ? callable
      : named;
  if (matches.length === 1) return matches[0];

  if (matches.length === 0) {
    const close = search(model, name, 5).map(
      (n) => `  ${label(n)}  ${n.file}:${n.line}`,
    );
    throw new SymbolLookupError(
      `No symbol named "${query}".${close.length ? ` Closest matches:\n${close.join("\n")}` : ""}`,
    );
  }
  const sameKind = (n: GraphNode) =>
    matches.filter((m) => m.kind === n.kind).length > 1;
  const list = matches.map(
    (n) =>
      `  ${sameKind(n) ? n.id : `${n.kind}:${n.name}`}  ${n.file}:${n.line}`,
  );
  throw new SymbolLookupError(
    `"${query}" matches ${matches.length} symbols. Pass one of:\n${list.join("\n")}`,
  );
}

/**
 * Tree of what `id` is built from (or what uses it), `depth` levels deep.
 * A symbol is expanded once; later occurrences are marked `repeated`.
 */
export function flow(
  model: GraphModel,
  id: string,
  options: Partial<FlowOptions> = {},
): FlowNode {
  const opts = { ...DEFAULT_FLOW, ...options };
  const kinds = new Set<NodeKind>();
  if (opts.mixins) kinds.add("mixin");
  if (opts.functions) kinds.add("function");
  if (opts.variables) kinds.add("variable");
  if (opts.files) kinds.add("module");
  const filters: Filters = { kinds, publicOnly: false };
  const direction = opts.direction === "dependencies" ? "out" : "in";
  const expanded = new Set<string>();

  // Breadth-first, so a symbol is expanded at its shallowest position.
  const root: FlowNode = {
    node: model.byId.get(id)!,
    children: [],
    repeated: false,
    cut: 0,
    indirect: false,
  };
  expanded.add(id);
  let level = [root];
  for (let d = 0; d < opts.depth && level.length; d++) {
    const next: FlowNode[] = [];
    for (const parent of level) {
      const links = [
        ...visibleNeighbours(model, parent.node.id, filters, direction),
      ]
        .map(([n, { direct }]) => ({ node: model.byId.get(n)!, direct }))
        .sort(
          (a, b) =>
            a.node.file.localeCompare(b.node.file) || a.node.line - b.node.line,
        );
      for (const { node, direct } of links) {
        const repeated = expanded.has(node.id);
        const child: FlowNode = {
          node,
          children: [],
          repeated,
          cut: 0,
          indirect: !direct,
        };
        parent.children.push(child);
        if (!repeated) {
          expanded.add(node.id);
          next.push(child);
        }
      }
    }
    level = next;
  }
  for (const leaf of level) {
    leaf.cut = visibleNeighbours(model, leaf.node.id, filters, direction).size;
  }
  return root;
}

/** Number of distinct symbols in the tree, the root excluded. */
export function flowSize(tree: FlowNode): number {
  const ids = new Set<string>();
  const walk = (n: FlowNode) => {
    for (const c of n.children) {
      ids.add(c.node.id);
      walk(c);
    }
  };
  walk(tree);
  return ids.size;
}
