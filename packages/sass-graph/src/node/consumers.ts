import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { type ConsumerSources, consumerUsage } from "../analysis/consumers.js";
import { buildGraph } from "../parser/build.js";
import type { SassGraph } from "../parser/types.js";
import { SASS_ROOT } from "./sources.js";

/** A library repo that uses the engine, and the folders that ship its Sass. */
export interface ConsumerRepo {
  name: string;
  /** Folder name next to the theming repo in the workspace. */
  folder: string;
  include: string[];
}

/** The libraries checked by default; demos and tests are left out, they do not ship. */
export const DEFAULT_CONSUMERS: ConsumerRepo[] = [
  {
    name: "igniteui-angular",
    folder: "angular",
    include: [
      "projects/igniteui-angular",
      "projects/igniteui-angular-elements",
    ],
  },
  {
    name: "igniteui-webcomponents",
    folder: "web-components",
    include: ["src"],
  },
  { name: "igniteui-grid-lite", folder: "grid-lite", include: ["src"] },
  { name: "igniteui-dockmanager", folder: "dock-manager", include: ["src"] },
];

/** The folder that holds the theming repo and its siblings. */
export const WORKSPACE = resolve(SASS_ROOT, "../../../..");

const SKIP = new Set(["node_modules", "dist", ".git", "coverage"]);

function readScss(root: string, dir: string, out: Map<string, string>) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) readScss(root, full, out);
    else if (entry.name.endsWith(".scss")) {
      out.set(
        relative(root, full).split(sep).join("/"),
        readFileSync(full, "utf8"),
      );
    }
  }
}

export interface LoadedConsumers {
  found: ConsumerSources[];
  /** Consumers whose folder is not in the workspace. */
  missing: { name: string; path: string }[];
}

/**
 * Reads the Sass of each consumer repo found next to the theming repo
 * (or under `workspace`). A missing repo is reported, not an error.
 */
export function loadConsumers(
  repos: ConsumerRepo[] = DEFAULT_CONSUMERS,
  workspace = WORKSPACE,
): LoadedConsumers {
  const found: ConsumerSources[] = [];
  const missing: LoadedConsumers["missing"] = [];
  for (const repo of repos) {
    const root = join(workspace, repo.folder);
    if (!existsSync(root)) {
      missing.push({ name: repo.name, path: root });
      continue;
    }
    const sources = new Map<string, string>();
    for (const dir of repo.include) {
      const full = join(root, dir);
      if (existsSync(full)) readScss(root, full, sources);
    }
    found.push({ name: repo.name, sources });
  }
  return { found, missing };
}

export interface EngineGraph {
  sources: Map<string, string>;
  graph: SassGraph;
  /** Consumer repos that were expected but not found. */
  missing: LoadedConsumers["missing"];
}

/** The engine graph from `sources`, with consumer usage attached when `consumers` is on and a repo is found. */
export function engineGraph(
  sources: Map<string, string>,
  consumers = true,
): EngineGraph {
  const graph = buildGraph(sources, "packages/theming/sass");
  if (!consumers) return { sources, graph, missing: [] };
  const { found, missing } = loadConsumers();
  if (found.length) graph.consumers = consumerUsage(sources, found);
  return { sources, graph, missing };
}
