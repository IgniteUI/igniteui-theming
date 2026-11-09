/**
 * Parse packages/theming/sass and write public/graph.json for the app.
 *
 * Usage: tsx scripts/build-graph.ts [sassRoot] [outFile]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildGraph } from "../src/parser/build.js";
import { loadSources } from "../src/parser/load.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.argv[2] ?? join(here, "../../theming/sass"));
const out = resolve(process.argv[3] ?? join(here, "../public/graph.json"));

const started = performance.now();
const graph = buildGraph(loadSources(root), "packages/theming/sass");
const ms = Math.round(performance.now() - started);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(graph));

const count = (kind: string) =>
  graph.nodes.filter((n) => n.kind === kind).length;
const log = (msg: string) => process.stdout.write(`${msg}\n`);
log(`Parsed ${count("module")} files in ${ms}ms`);
log(
  `  variables: ${count("variable")}  mixins: ${count("mixin")}  functions: ${count("function")}`,
);
log(
  `  edges: ${graph.edges.length}  unresolved refs: ${graph.unresolved.length}`,
);
log(`Wrote ${out}`);
