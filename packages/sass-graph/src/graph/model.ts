import { componentOf, systemOf } from "../analysis/systems.js";
import type { GraphNode, NodeKind, SassGraph } from "../parser/types.js";
import {
  type Adjacency,
  buildAdjacency,
  downstream,
  upstream,
} from "./traverse.js";

export interface GraphModel {
  graph: SassGraph;
  byId: Map<string, GraphNode>;
  adjacency: Adjacency;
}

export function createModel(graph: SassGraph): GraphModel {
  return {
    graph,
    byId: new Map(graph.nodes.map((n) => [n.id, n])),
    adjacency: buildAdjacency(graph.edges),
  };
}

export type Role =
  | "selected"
  | "changed"
  | "upstream"
  | "downstream"
  | "neutral";

export interface ViewNode {
  node: GraphNode;
  role: Role;
  /** Hop distance from the root(s), 0 for roots. */
  distance: number;
}

/** Edge as drawn: from dependency (source) to dependent (target). */
export interface ViewEdge {
  id: string;
  source: string;
  target: string;
  /** True when the link passes through nodes hidden by the filters. */
  indirect?: boolean;
  /** Number of symbol-level links an aggregated edge stands for. */
  weight?: number;
}

export interface SubGraph {
  nodes: ViewNode[];
  edges: ViewEdge[];
  /** Number of reachable nodes dropped because of `limit`. */
  truncated: number;
}

export interface Filters {
  kinds: ReadonlySet<NodeKind>;
  publicOnly: boolean;
}

export const passes = (n: GraphNode, f: Filters) =>
  f.kinds.has(n.kind) && (!f.publicOnly || n.access === "public");

/** Keep the `limit` nearest entries. */
function nearest(map: Map<string, number>, limit: number): [string, number][] {
  return [...map].sort((a, b) => a[1] - b[1]).slice(0, limit);
}

/**
 * Nearest dependencies (`out`) or dependents (`in`) of `id` that pass the
 * filters, walking through the ones that do not. `direct` is false when a
 * hidden node lies in between.
 */
export function visibleNeighbours(
  model: GraphModel,
  id: string,
  filters: Filters,
  direction: "out" | "in" = "out",
): Map<string, { direct: boolean }> {
  const found = new Map<string, { direct: boolean }>();
  const seen = new Set([id]);
  let frontier = [id];
  let direct = true;
  while (frontier.length) {
    const next: string[] = [];
    for (const from of frontier) {
      for (const to of model.adjacency[direction].get(from) ?? []) {
        if (seen.has(to)) continue;
        seen.add(to);
        if (passes(model.byId.get(to)!, filters)) found.set(to, { direct });
        else next.push(to);
      }
    }
    frontier = next;
    direct = false;
  }
  return found;
}

/** Links between the shown nodes, including those that pass through filtered-out nodes. */
function collectEdges(
  model: GraphModel,
  ids: Set<string>,
  filters: Filters,
): ViewEdge[] {
  const edges: ViewEdge[] = [];
  for (const from of ids) {
    for (const [to, { direct }] of visibleNeighbours(model, from, filters)) {
      if (!ids.has(to)) continue;
      edges.push({
        id: `${to}>${from}`,
        source: to,
        target: from,
        indirect: !direct,
      });
    }
  }
  return edges;
}

/** The selected symbol plus `depth` hops up- and downstream. */
export function focusView(
  model: GraphModel,
  id: string,
  depth: number,
  filters: Filters,
  limit = 250,
): SubGraph {
  const root = model.byId.get(id);
  if (!root) return { nodes: [], edges: [], truncated: 0 };

  const up = upstream(model.adjacency, id, depth);
  const down = downstream(model.adjacency, id, depth);
  const keep = (m: Map<string, number>) =>
    new Map([...m].filter(([n]) => passes(model.byId.get(n)!, filters)));
  const upF = keep(up);
  const downF = keep(down);

  const half = Math.floor((limit - 1) / 2);
  const upList = nearest(upF, Math.max(half, limit - 1 - downF.size));
  const downList = nearest(downF, limit - 1 - upList.length);

  const nodes: ViewNode[] = [{ node: root, role: "selected", distance: 0 }];
  for (const [n, d] of upList)
    nodes.push({ node: model.byId.get(n)!, role: "upstream", distance: d });
  for (const [n, d] of downList) {
    // A node can be both up- and downstream in a cycle; upstream wins.
    if (!upF.has(n))
      nodes.push({ node: model.byId.get(n)!, role: "downstream", distance: d });
  }

  const ids = new Set(nodes.map((n) => n.node.id));
  return {
    nodes,
    edges: collectEdges(model, ids, filters),
    truncated:
      new Set([...upF.keys(), ...downF.keys()]).size - (nodes.length - 1),
  };
}

/** Everything downstream of the changed nodes (the "blast radius"). */
export function impactSet(
  model: GraphModel,
  changed: Iterable<string>,
): Map<string, number> {
  const result = new Map<string, number>();
  const roots = new Set(changed);
  for (const id of roots) {
    for (const [n, d] of downstream(model.adjacency, id)) {
      if (roots.has(n)) continue;
      const prev = result.get(n);
      if (prev === undefined || d < prev) result.set(n, d);
    }
  }
  return result;
}

/** Changed nodes plus their downstream impact up to `depth`. */
export function impactView(
  model: GraphModel,
  changed: ReadonlySet<string>,
  depth: number,
  filters: Filters,
  limit = 250,
): SubGraph {
  const all = new Map(
    [...impactSet(model, changed)].filter(
      ([n, d]) => d <= depth && passes(model.byId.get(n)!, filters),
    ),
  );
  const list = nearest(all, Math.max(0, limit - changed.size));
  const nodes: ViewNode[] = [
    ...[...changed].map((id) => ({
      node: model.byId.get(id)!,
      role: "changed" as const,
      distance: 0,
    })),
    ...list.map(([n, d]) => ({
      node: model.byId.get(n)!,
      role: "downstream" as const,
      distance: d,
    })),
  ];
  const ids = new Set(nodes.map((n) => n.node.id));
  return {
    nodes,
    edges: collectEdges(model, ids, filters),
    truncated: all.size - list.length,
  };
}

export interface SystemSummary {
  system: string;
  mixins: number;
  functions: number;
  variables: number;
  /** Symbols that pass the filters. */
  visible: number;
  affected: number;
}

/**
 * One node per system with a visible symbol, and one edge per system pair
 * linked by symbol-level dependencies, including links through hidden nodes.
 */
export function systemMap(
  model: GraphModel,
  filters: Filters,
  affected: ReadonlyMap<string, number> = new Map(),
): { systems: SystemSummary[]; edges: ViewEdge[] } {
  const stats = new Map<string, SystemSummary>();
  for (const n of model.graph.nodes) {
    if (n.kind === "module") continue;
    const key = systemOf(n.folder);
    let s = stats.get(key);
    if (!s) {
      s = {
        system: key,
        mixins: 0,
        functions: 0,
        variables: 0,
        visible: 0,
        affected: 0,
      };
      stats.set(key, s);
    }
    if (n.kind === "mixin") s.mixins++;
    else if (n.kind === "function") s.functions++;
    else s.variables++;
    if (passes(n, filters)) s.visible++;
    if (affected.has(n.id)) s.affected++;
  }

  const links = new Map<string, { edge: ViewEdge; direct: boolean }>();
  for (const n of model.graph.nodes) {
    if (n.kind === "module" || !passes(n, filters)) continue;
    const target = systemOf(n.folder);
    for (const [dep, { direct }] of visibleNeighbours(model, n.id, filters)) {
      const dn = model.byId.get(dep)!;
      if (dn.kind === "module") continue;
      const source = systemOf(dn.folder);
      if (source === target) continue;
      const id = `${source}>${target}`;
      const link = links.get(id);
      if (link) {
        link.edge.weight = (link.edge.weight ?? 0) + 1;
        link.direct ||= direct;
      } else {
        links.set(id, { edge: { id, source, target, weight: 1 }, direct });
      }
    }
  }

  return {
    systems: [...stats.values()]
      .filter((s) => s.visible > 0)
      .sort((a, b) => a.system.localeCompare(b.system)),
    edges: [...links.values()].map(({ edge, direct }) => ({
      ...edge,
      indirect: !direct,
    })),
  };
}

/**
 * Every visible symbol of `system` plus the outside symbols they use directly
 * (role `upstream`), with the links between them.
 */
export function systemView(
  model: GraphModel,
  system: string,
  filters: Filters,
): SubGraph {
  const own = model.graph.nodes.filter(
    (n) =>
      n.kind !== "module" &&
      systemOf(n.folder) === system &&
      passes(n, filters),
  );
  const ids = new Set(own.map((n) => n.id));
  const outside = new Set<string>();
  for (const n of own) {
    for (const dep of visibleNeighbours(model, n.id, filters).keys()) {
      if (!ids.has(dep) && model.byId.get(dep)!.kind !== "module") {
        outside.add(dep);
      }
    }
  }
  for (const id of outside) ids.add(id);

  return {
    nodes: [
      ...own.map((node) => ({ node, role: "neutral" as const, distance: 0 })),
      ...[...outside].map((id) => ({
        node: model.byId.get(id)!,
        role: "upstream" as const,
        distance: 1,
      })),
    ],
    // Outside symbols are drawn only as dependencies of this system.
    edges: collectEdges(model, ids, filters).filter(
      (e) => !outside.has(e.target),
    ),
    truncated: 0,
  };
}

/** Group affected ids by component theme folder (`themes/components/<name>`). */
export function affectedComponents(
  model: GraphModel,
  affected: Iterable<string>,
): { component: string; ids: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const id of affected) {
    const component = componentOf(model.byId.get(id)?.folder ?? "");
    if (!component) continue;
    if (!groups.has(component)) groups.set(component, []);
    groups.get(component)!.push(id);
  }
  return [...groups]
    .map(([component, ids]) => ({ component, ids }))
    .sort(
      (a, b) =>
        b.ids.length - a.ids.length || a.component.localeCompare(b.component),
    );
}

/** Rank symbols (not modules) by how well their name matches `query`. */
export function search(
  model: GraphModel,
  query: string,
  limit = 20,
): GraphNode[] {
  const q = query
    .trim()
    .replace(/^\$/, "")
    .replace(/\(\)$/, "")
    .replace(/_/g, "-")
    .toLowerCase();
  if (!q) return [];
  const scored: [number, GraphNode][] = [];
  for (const n of model.graph.nodes) {
    if (n.kind === "module") continue;
    const name = n.name.toLowerCase();
    const idx = name.indexOf(q);
    if (idx === -1) continue;
    const score = (name === q ? 0 : idx === 0 ? 1 : 2) * 1000 + name.length;
    scored.push([score, n]);
  }
  return scored
    .sort((a, b) => a[0] - b[0])
    .slice(0, limit)
    .map(([, n]) => n);
}
