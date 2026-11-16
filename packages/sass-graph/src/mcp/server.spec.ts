import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeAll, describe, expect, it } from "vitest";
import { LIBRARY } from "../analysis/fixtures.js";
import { createEngineServer } from "./server.js";

const head = new Map(LIBRARY);
head.set(
  "themes/_functions.scss",
  LIBRARY.get("themes/_functions.scss")!.replace("@return 1;", "@return 2;"),
);

let client: Client;
beforeAll(async () => {
  const server = createEngineServer({
    current: () => head,
    at: (ref) => {
      if (ref !== "base") throw new Error(`"${ref}" is not a commit.`);
      return LIBRARY;
    },
    pathPrefix: "sass/",
  });
  const [a, b] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "test", version: "0" });
  await Promise.all([server.connect(a), client.connect(b)]);
});

const call = async (name: string, args: Record<string, unknown>) => {
  const result = await client.callTool({ name, arguments: args });
  const [first] = result.content as { text: string }[];
  return { text: first.text, isError: result.isError === true };
};

describe("engine MCP server", () => {
  it("lists the four engine tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "sass_flow",
      "sass_impact",
      "sass_report",
      "sass_search",
    ]);
  });

  it("prints a flow for a symbol", async () => {
    const { text } = await call("sass_flow", { symbol: "button-theme" });
    expect(text).toContain("button-theme() is built from:");
    expect(text).toContain("├─ digest-schema()  sass/themes/_functions.scss:4");
  });

  it("returns a lookup failure as a tool error with the candidates", async () => {
    const result = await call("sass_flow", { symbol: "digest" });
    expect(result.isError).toBe(true);
    expect(result.text).toContain("Closest matches:");
  });

  it("compares the working tree with a ref", async () => {
    const { text } = await call("sass_impact", { base: "base" });
    expect(text).toContain(
      "| changed | `var-get()` | `sass/themes/_functions.scss:5` |",
    );
  });

  it("returns a bad ref as a tool error", async () => {
    const result = await call("sass_impact", { base: "nope" });
    expect(result).toEqual({ text: '"nope" is not a commit.', isError: true });
  });

  it("returns one report section when a check is given", async () => {
    const { text } = await call("sass_report", { check: "outliers" });
    expect(text).toContain("## Component themes that skip a shared helper (1)");
    expect(text).not.toContain("## Hotspots");
  });

  it("finds symbols by part of a name", async () => {
    const { text } = await call("sass_search", { query: "icon" });
    expect(text.split("\n")[0]).toMatch(
      /^icon-theme\(\) {2}function:icon-theme/,
    );
  });
});
