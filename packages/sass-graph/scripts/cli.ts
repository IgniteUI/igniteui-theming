/**
 * Answers questions about the Sass engine from the command line.
 *
 * Usage: tsx scripts/cli.ts flow <symbol> [--users] [--depth N] [--vars] [--files]
 *        tsx scripts/cli.ts impact [--base <ref>] [--format text|markdown] [--link-base <url>] [--out <file>] [--no-consumers]
 *        tsx scripts/cli.ts report [--format text|markdown|json] [--out <file>] [--no-consumers]
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { DEFAULT_FLOW, flow, resolveSymbol } from "../src/analysis/flow.js";
import {
  formatFlow,
  formatImpact,
  formatReport,
} from "../src/analysis/format.js";
import { analyzeImpact } from "../src/analysis/impact.js";
import { buildReport } from "../src/analysis/report.js";
import { createModel } from "../src/graph/model.js";
import { engineGraph } from "../src/node/consumers.js";
import { SASS_PREFIX, sourcesAt, workingSources } from "../src/node/sources.js";
import { buildGraph } from "../src/parser/build.js";

const USAGE = `Usage:
  npm run graph:flow -- <symbol> [--users] [--depth N] [--vars] [--files]
  npm run graph:impact -- [--base <ref>] [--format text|markdown] [--link-base <url>] [--out <file>] [--no-consumers]
  npm run graph:report -- [--format text|markdown|json] [--out <file>] [--no-consumers]

<symbol> is a name (palette), name() for a mixin or function, $name for a
variable, kind:name (mixin:type-style) or a full node id.

impact and report also read the Sass of igniteui-angular, igniteui-webcomponents,
igniteui-grid-lite and igniteui-dockmanager when those repos sit next to
igniteui-theming, so library use counts. --no-consumers skips them.`;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    users: { type: "boolean", default: false },
    depth: { type: "string", default: String(DEFAULT_FLOW.depth) },
    vars: { type: "boolean", default: false },
    files: { type: "boolean", default: false },
    base: { type: "string", default: "origin/master" },
    format: { type: "string" },
    "link-base": { type: "string" },
    out: { type: "string" },
    "no-consumers": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

/** The working tree's graph, with library usage unless --no-consumers; warns once per missing repo. */
function engine() {
  const result = engineGraph(workingSources(), !values["no-consumers"]);
  for (const m of result.missing) {
    process.stderr.write(
      `${m.name} not found at ${m.path}; its use of the engine is not counted.\n`,
    );
  }
  return result;
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function emit(text: string) {
  if (values.out) {
    // npm runs workspace scripts in the package folder; INIT_CWD is where npm was called.
    const out = resolve(process.env.INIT_CWD ?? process.cwd(), values.out);
    writeFileSync(out, `${text}\n`);
    process.stderr.write(`Wrote ${out}\n`);
  } else {
    process.stdout.write(`${text}\n`);
  }
}

function format<T extends string>(allowed: readonly T[], fallback: T): T {
  const f = values.format ?? fallback;
  if (!allowed.includes(f as T)) {
    fail(
      `--format "${f}" is not supported here. Use one of: ${allowed.join(", ")}.`,
    );
  }
  return f as T;
}

const [command, ...rest] = positionals;
if (values.help || !command) {
  process.stdout.write(`${USAGE}\n`);
  process.exit(command || values.help ? 0 : 1);
}

try {
  run(command, rest);
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}

function run(command: string, rest: string[]) {
  const pathPrefix = SASS_PREFIX();

  switch (command) {
    case "flow": {
      if (rest.length !== 1) fail(`flow expects one symbol.\n\n${USAGE}`);
      const depth = Number(values.depth);
      if (!Number.isInteger(depth) || depth < 1 || depth > 10) {
        fail(
          `--depth must be a whole number from 1 to 10, got "${values.depth}".`,
        );
      }
      const model = createModel(buildGraph(workingSources()));
      {
        const node = resolveSymbol(model, rest[0]);
        const options = {
          direction: values.users ? "dependents" : "dependencies",
          depth,
          variables: values.vars,
          files: values.files,
        } as const;
        emit(
          formatFlow(flow(model, node.id, options), options, { pathPrefix }),
        );
      }
      break;
    }
    case "impact": {
      const fmt = format(["text", "markdown"] as const, "text");
      const base = sourcesAt(values.base);
      const head = engine();
      const impact = analyzeImpact(
        base,
        head.sources,
        createModel(head.graph),
        head.graph.consumers,
      );
      emit(
        formatImpact(impact, fmt, {
          pathPrefix,
          linkBase: values["link-base"],
        }),
      );
      break;
    }
    case "report": {
      const fmt = format(["text", "markdown", "json"] as const, "text");
      const report = buildReport(createModel(engine().graph));
      emit(
        fmt === "json"
          ? JSON.stringify(report, null, 2)
          : formatReport(report, fmt, { pathPrefix }),
      );
      break;
    }
    default:
      fail(`Unknown command "${command}".\n\n${USAGE}`);
  }
}
