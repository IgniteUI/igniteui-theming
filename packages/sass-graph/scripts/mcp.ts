/**
 * Starts the engine MCP server over STDIO for this checkout.
 *
 * Usage: npm run graph:mcp
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createEngineServer } from "../src/mcp/server.js";
import { engineGraph } from "../src/node/consumers.js";
import { SASS_PREFIX, sourcesAt, workingSources } from "../src/node/sources.js";

const server = createEngineServer({
  current: workingSources,
  graph: (sources) => engineGraph(sources).graph,
  at: sourcesAt,
  pathPrefix: SASS_PREFIX(),
});
await server.connect(new StdioServerTransport());
