import type { EdgeType, GraphEdge } from "../parser/types.js";

/** Edge types that carry symbol-level impact (module import edges do not). */
export const IMPACT_EDGES: ReadonlySet<EdgeType> = new Set([
  "uses-var",
  "includes",
  "calls",
]);

export interface Adjacency {
  /** id → ids it depends on */
  out: Map<string, string[]>;
  /** id → ids that depend on it */
  in: Map<string, string[]>;
}

export function buildAdjacency(
  edges: GraphEdge[],
  types: ReadonlySet<EdgeType> = IMPACT_EDGES,
): Adjacency {
  const out = new Map<string, string[]>();
  const inn = new Map<string, string[]>();
  for (const e of edges) {
    if (!types.has(e.type)) continue;
    if (!out.has(e.from)) out.set(e.from, []);
    if (!inn.has(e.to)) inn.set(e.to, []);
    out.get(e.from)!.push(e.to);
    inn.get(e.to)!.push(e.from);
  }
  return { out, in: inn };
}

/**
 * Breadth-first walk from `start`. Returns each reached id with its distance
 * (the start itself is not included). `depth` of Infinity walks everything.
 */
function walk(
  map: Map<string, string[]>,
  start: string,
  depth: number,
): Map<string, number> {
  const seen = new Map<string, number>();
  let frontier = [start];
  for (let d = 1; d <= depth && frontier.length; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const n of map.get(id) ?? []) {
        if (n === start || seen.has(n)) continue;
        seen.set(n, d);
        next.push(n);
      }
    }
    frontier = next;
  }
  return seen;
}

/** What `id` relies on. */
export const upstream = (
  adj: Adjacency,
  id: string,
  depth = Number.POSITIVE_INFINITY,
) => walk(adj.out, id, depth);

/** What is affected if `id` changes. */
export const downstream = (
  adj: Adjacency,
  id: string,
  depth = Number.POSITIVE_INFINITY,
) => walk(adj.in, id, depth);
