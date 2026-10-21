#!/usr/bin/env node
/**
 * Ignite UI Theming MCP Server
 *
 * A Model Context Protocol server for generating Ignite UI theming code.
 * Provides tools for creating palettes, typography, elevations, and complete themes.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

/**
 * Main entry point - start the MCP server with STDIO transport.
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle graceful shutdown
  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// Run the server
main().catch((_error) => {
  process.exit(1);
});
