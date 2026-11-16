import { describe, expect, it } from "vitest";
import type { GraphEdge } from "../parser/types.js";
import { buildAdjacency, downstream, upstream } from "./traverse.js";

// a -> b -> c, d -> b, c -> a (cycle), m imports c (ignored for impact)
const edges: GraphEdge[] = [
  { from: "a", to: "b", type: "calls" },
  { from: "b", to: "c", type: "uses-var" },
  { from: "d", to: "b", type: "includes" },
  { from: "c", to: "a", type: "calls" },
  { from: "m", to: "c", type: "imports" },
];
const adj = buildAdjacency(edges);
const obj = (m: Map<string, number>) => Object.fromEntries(m);

describe("traverse", () => {
  it("walks upstream with distances and survives cycles", () => {
    expect(obj(upstream(adj, "a"))).toEqual({ b: 1, c: 2 });
  });

  it("walks downstream and ignores module import edges", () => {
    expect(obj(downstream(adj, "c"))).toEqual({ b: 1, a: 2, d: 2 });
  });

  it("limits depth", () => {
    expect(obj(downstream(adj, "c", 1))).toEqual({ b: 1 });
  });
});
