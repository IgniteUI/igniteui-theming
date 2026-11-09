import { buildAdjacency, IMPACT_EDGES, upstream } from "../graph/traverse.js";
import { buildGraph } from "../parser/build.js";
import type { SassGraph } from "../parser/types.js";

/** Where a library that uses the engine keeps its Sass. */
export interface ConsumerSources {
  /** Package name, e.g. `igniteui-angular`. */
  name: string;
  /** `path relative to the consumer repo → source`. */
  sources: Map<string, string>;
}

/** How libraries use the engine; stored in `graph.json` as plain JSON. */
export interface ConsumerUsage {
  consumers: { name: string; files: number }[];
  /** Engine node id → consumer → its files that use the symbol directly. */
  direct: Record<string, Record<string, string[]>>;
  /** Engine node id → consumers that re-export it with `@forward`. */
  reexported: Record<string, string[]>;
  /** Engine node ids that consumer code reaches, directly or through other engine code. */
  reached: string[];
}

/** Content of the package's root `_index.scss`, which the bare `igniteui-theming` URL loads. */
export const PACKAGE_INDEX = [
  "config",
  "bem",
  "color",
  "elevations",
  "themes",
  "typography",
  "utils",
]
  .map((m) => `@forward '../${m}';`)
  .join("\n");

const PACKAGE_KEY = "@package/index.scss";

/**
 * Maps `igniteui-theming`, `igniteui-theming/sass` and `igniteui-theming/sass/<path>`
 * (with an optional `~`) to paths in the engine's source map.
 */
export function engineAlias(url: string): string | undefined {
  const u = url.replace(/^~/, "");
  if (u === "igniteui-theming") return "@package/index";
  if (u === "igniteui-theming/sass" || u === "igniteui-theming/sass/") {
    return "index";
  }
  const m = u.match(/^igniteui-theming\/sass\/(.+)$/);
  return m ? m[1].replace(/\.scss$/, "") : undefined;
}

/** `@<name>/…` keys belong to a consumer; engine keys have no `@`. */
const consumerOf = (file: string) =>
  file.startsWith("@") && !file.startsWith("@package/")
    ? file.slice(1, file.indexOf("/"))
    : null;

/**
 * Parses the engine together with its consumers, resolving package URLs the
 * way Sass does, and records which engine symbols each consumer calls,
 * re-exports or reaches.
 */
export function consumerUsage(
  engine: Map<string, string>,
  consumers: ConsumerSources[],
): ConsumerUsage {
  const sources = new Map(engine);
  sources.set(PACKAGE_KEY, PACKAGE_INDEX);
  for (const c of consumers) {
    for (const [path, source] of c.sources) {
      sources.set(`@${c.name}/${path}`, source);
    }
  }
  const combined: SassGraph = buildGraph(sources, "", {
    alias: engineAlias,
    reexportsFrom: (file) => consumerOf(file) !== null,
    reportUnresolved: () => false,
  });
  const fileOf = new Map(combined.nodes.map((n) => [n.id, n.file]));
  const isEngine = (id: string) => {
    const file = fileOf.get(id);
    return file !== undefined && !file.startsWith("@");
  };

  const direct: ConsumerUsage["direct"] = {};
  const reexported: ConsumerUsage["reexported"] = {};
  const roots = new Set<string>();
  for (const e of combined.edges) {
    const consumer = consumerOf(fileOf.get(e.from) ?? "");
    if (!consumer || !isEngine(e.to)) continue;
    if (e.type === "re-exports") {
      reexported[e.to] ??= [];
      if (!reexported[e.to].includes(consumer)) reexported[e.to].push(consumer);
    } else if (IMPACT_EDGES.has(e.type)) {
      direct[e.to] ??= {};
      direct[e.to][consumer] ??= [];
      const files = direct[e.to][consumer];
      const file = fileOf.get(e.from)!.slice(consumer.length + 2);
      if (!files.includes(file)) files.push(file);
      roots.add(e.to);
    }
  }

  const adjacency = buildAdjacency(combined.edges);
  const reached = new Set(roots);
  for (const id of roots) {
    for (const dep of upstream(adjacency, id).keys()) {
      if (isEngine(dep)) reached.add(dep);
    }
  }

  return {
    consumers: consumers.map((c) => ({ name: c.name, files: c.sources.size })),
    direct,
    reexported,
    reached: [...reached].sort(),
  };
}

/** Consumers that call `id` directly, with their file counts. */
export function directUsers(
  usage: ConsumerUsage | undefined,
  id: string,
): { consumer: string; files: number }[] {
  return Object.entries(usage?.direct[id] ?? {})
    .map(([consumer, files]) => ({ consumer, files: files.length }))
    .sort((a, b) => b.files - a.files);
}
