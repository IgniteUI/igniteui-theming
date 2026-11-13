import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DEFAULT_FLOW, flow, resolveSymbol } from "../analysis/flow.js";
import { formatFlow, formatImpact, formatReport } from "../analysis/format.js";
import { analyzeImpact } from "../analysis/impact.js";
import { buildReport, type CheckId } from "../analysis/report.js";
import { label } from "../analysis/systems.js";
import { createModel, type GraphModel, search } from "../graph/model.js";
import { buildGraph } from "../parser/build.js";
import type { SassGraph } from "../parser/types.js";

export interface EngineSources {
  /** The library as it is now (`relative path → source`). */
  current: () => Map<string, string>;
  /** Builds the current graph, with consumer usage when available; defaults to the engine alone. */
  graph?: (sources: Map<string, string>) => SassGraph;
  /** The library at a git ref. */
  at: (ref: string) => Map<string, string>;
  /** Prefix that turns a library-relative path into a repository path. */
  pathPrefix: string;
}

const CHECKS: [CheckId, ...CheckId[]] = [
  "hotspots",
  "outliers",
  "unused-private",
  "unused-public",
  "undocumented",
  "cycles",
  "unresolved",
];

const text = (value: string) => ({
  content: [{ type: "text" as const, text: value }],
});
const error = (e: unknown) => ({
  isError: true,
  content: [
    { type: "text" as const, text: e instanceof Error ? e.message : String(e) },
  ],
});

/** MCP server for people and agents working on the engine; it reads the library on every call. */
export function createEngineServer(sources: EngineSources): McpServer {
  const server = new McpServer({
    name: "igniteui-theming-engine",
    version: "0.0.0",
  });
  const graphOf = (s: Map<string, string>) =>
    sources.graph ? sources.graph(s) : buildGraph(s);
  const model = (): GraphModel => createModel(graphOf(sources.current()));
  const opts = { pathPrefix: sources.pathPrefix };

  server.registerTool(
    "sass_search",
    {
      title: "Find Sass symbols",
      description:
        "Finds variables, mixins and functions of the igniteui-theming Sass library by name. Use it to get the exact name to pass to sass_flow.",
      inputSchema: { query: z.string().min(1) },
    },
    async ({ query }) => {
      const hits = search(model(), query, 20);
      return text(
        hits.length
          ? hits
              .map(
                (n) =>
                  `${label(n)}  ${n.kind}:${n.name}  ${sources.pathPrefix}${n.file}:${n.line}${n.description ? `  ${n.description}` : ""}`,
              )
              .join("\n")
          : `No symbol matches "${query}".`,
      );
    },
  );

  server.registerTool(
    "sass_flow",
    {
      title: "Explain how a Sass symbol works",
      description:
        "Prints the call tree of a mixin, function or variable of the igniteui-theming Sass library: what it is built from (direction dependencies) or what uses it (direction dependents), with file:line and the first sentence of each sassdoc. Use it to understand a flow such as palette generation or a component theme before changing it.",
      inputSchema: {
        symbol: z
          .string()
          .min(1)
          .describe(
            "palette, palette(), $name, kind:name (mixin:type-style) or a full node id",
          ),
        direction: z
          .enum(["dependencies", "dependents"])
          .default(DEFAULT_FLOW.direction),
        depth: z.number().int().min(1).max(10).default(DEFAULT_FLOW.depth),
        variables: z.boolean().default(false),
        files: z.boolean().default(false),
      },
    },
    async ({ symbol, direction, depth, variables, files }) => {
      try {
        const m = model();
        const node = resolveSymbol(m, symbol);
        const options = { direction, depth, variables, files };
        return text(formatFlow(flow(m, node.id, options), options, opts));
      } catch (e) {
        return error(e);
      }
    },
  );

  server.registerTool(
    "sass_impact",
    {
      title: "What a Sass change affects",
      description:
        "Compares the igniteui-theming Sass library in the working tree with a git ref and lists the changed declarations (comment-only edits excluded), how many symbols they reach and which component themes. Run it before and after editing the engine.",
      inputSchema: {
        base: z.string().min(1).default("origin/master"),
      },
    },
    async ({ base }) => {
      try {
        const current = sources.current();
        const graph = graphOf(current);
        return text(
          formatImpact(
            analyzeImpact(
              sources.at(base),
              current,
              createModel(graph),
              graph.consumers,
            ),
            "markdown",
            opts,
          ),
        );
      } catch (e) {
        return error(e);
      }
    },
  );

  server.registerTool(
    "sass_report",
    {
      title: "Sass engine health report",
      description:
        "Runs health checks over the igniteui-theming Sass library: hotspots, component themes that skip a shared helper, unused private symbols, public engine code with no internal user or no docs, dependency cycles and unresolved references. Pass check to get one section.",
      inputSchema: { check: z.enum(CHECKS).optional() },
    },
    async ({ check }) => {
      const report = buildReport(model());
      if (check) {
        report.checks = report.checks.filter((c) => c.id === check);
      }
      return text(formatReport(report, "markdown", opts));
    },
  );

  return server;
}
