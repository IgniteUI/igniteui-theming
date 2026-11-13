/**
 * Parse packages/theming/sass and write public/graph.json for the app.
 *
 * Usage: tsx scripts/build-graph.ts [sassRoot] [outFile] [--no-consumers]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { engineGraph } from "../src/node/consumers.js";
import { loadSources } from "../src/parser/load.js";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const consumers = !process.argv.includes("--no-consumers");
const root = resolve(args[0] ?? join(here, "../../theming/sass"));
const out = resolve(args[1] ?? join(here, "../public/graph.json"));

const started = performance.now();
const { graph, missing } = engineGraph(loadSources(root), consumers);
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
log(
  graph.consumers
    ? `  libraries: ${graph.consumers.consumers.map((c) => `${c.name} (${c.files})`).join(", ")}`
    : "  libraries: not scanned",
);
for (const m of missing) log(`  ${m.name} not found at ${m.path}`);
log(`Wrote ${out}`);
