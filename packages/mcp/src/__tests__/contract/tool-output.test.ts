/**
 * Contract tests for tool output.
 *
 * These tests call the tools through a real MCP client connected to the
 * server in-process, extract every fenced `scss`/`css` block from the
 * response, and compile it the way a consumer's build would: plain
 * `@use 'igniteui-theming…'` resolved from `node_modules` via `loadPaths`,
 * with no import rewriting and no custom importer.
 *
 * Anything a tool hands to an agent as a stylesheet must compile, and
 * anything that fails inside a handler must be flagged with `isError`.
 */

import { existsSync } from "node:fs";
import * as path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import * as sass from "sass-embedded";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../server.js";

type Platform = "angular" | "webcomponents" | "react" | "blazor" | "generic";

const DESIGN_SYSTEMS = ["material", "bootstrap", "fluent", "indigo"] as const;
const VARIANTS = ["light", "dark"] as const;
const OUTPUTS = ["sass", "css"] as const;

/**
 * Walk up from this file to the `node_modules` directory that contains
 * `igniteui-theming` (the workspace root in this monorepo).
 */
function findNodeModules(): string {
  let dir = import.meta.dirname;

  while (true) {
    const candidate = path.join(dir, "node_modules");

    if (existsSync(path.join(candidate, "igniteui-theming", "package.json"))) {
      return candidate;
    }

    const parent = path.dirname(dir);

    if (parent === dir) {
      throw new Error("Could not locate node_modules/igniteui-theming");
    }

    dir = parent;
  }
}

const NODE_MODULES = findNodeModules();

/** Holds a stand-in for `igniteui-angular/theming`. */
const FIXTURES = path.join(import.meta.dirname, "fixtures");

const PLATFORMS: Platform[] = [
  "angular",
  "webcomponents",
  "react",
  "blazor",
  "generic",
];

/** Platforms with Ignite UI components (excludes `generic`). */
const PRODUCT_PLATFORMS = PLATFORMS.filter((p) => p !== "generic");

const SURFACES = { light: "#fafafa", dark: "#222222" } as const;

let client: Client;
let compiler: sass.AsyncCompiler;

beforeAll(async () => {
  const server = createServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  client = new Client({ name: "contract-test", version: "0.0.0" });

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  compiler = await sass.initAsyncCompiler();
});

afterAll(async () => {
  await client?.close();
  await compiler?.dispose();
});

interface ToolResult {
  text: string;
  isError: boolean;
}

async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as { type: string; text?: string }[];

  return {
    text: content.map((c) => c.text ?? "").join("\n"),
    isError: result.isError === true,
  };
}

interface CodeBlock {
  lang: "scss" | "css";
  code: string;
}

function extractBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const fence = /```(scss|css)\n([\s\S]*?)```/g;

  for (const match of text.matchAll(fence)) {
    blocks.push({ lang: match[1] as CodeBlock["lang"], code: match[2] });
  }

  return blocks;
}

async function compileBlock(block: CodeBlock): Promise<string> {
  const result = await compiler.compileStringAsync(block.code, {
    syntax: block.lang === "css" ? "css" : "scss",
    loadPaths: [NODE_MODULES, FIXTURES],
  });

  return result.css;
}

/**
 * Call a tool, require a successful response with at least one code block,
 * and require every block to compile.
 */
async function expectCompiles(
  tool: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { text, isError } = await callTool(tool, args);

  expect(isError, text).toBe(false);

  const blocks = extractBlocks(text);

  expect(blocks.length, `no code blocks in:\n${text}`).toBeGreaterThan(0);

  for (const block of blocks) {
    const css = await compileBlock(block).catch((error: Error) => {
      throw new Error(
        `${block.lang} block failed to compile:\n${block.code}\n\n${error.message}`,
      );
    });

    // A quoted Sass variable (e.g. '$typeface') compiles fine but leaks
    // into the CSS as a literal string.
    expect(
      css,
      `unresolved Sass variable in output of:\n${block.code}`,
    ).not.toMatch(/\$[a-z]/i);
  }
}

function cartesian<T extends Record<string, readonly unknown[]>>(
  dims: T,
): { [K in keyof T]: T[K][number] }[] {
  return Object.entries(dims).reduce<Record<string, unknown>[]>(
    (acc, [key, values]) =>
      acc.flatMap((row) => values.map((v) => ({ ...row, [key]: v }))),
    [{}],
  ) as { [K in keyof T]: T[K][number] }[];
}

describe("tool output compiles", () => {
  describe("create_theme", () => {
    const cases = cartesian({
      platform: PLATFORMS,
      designSystem: DESIGN_SYSTEMS,
      variant: VARIANTS,
      output: OUTPUTS,
    });

    it.each(cases)("$platform / $designSystem / $variant / $output", async ({
      platform,
      designSystem,
      variant,
      output,
    }) => {
      await expectCompiles("create_theme", {
        platform,
        designSystem,
        variant,
        output,
        primaryColor: "#7b2cbf",
        secondaryColor: "#ff9e00",
        surfaceColor: SURFACES[variant],
      });
    });

    it.each(
      cartesian({ platform: PLATFORMS, output: OUTPUTS }),
    )("$platform / $output without typography, elevations and spacing", async ({
      platform,
      output,
    }) => {
      await expectCompiles("create_theme", {
        platform,
        output,
        primaryColor: "#7b2cbf",
        secondaryColor: "#ff9e00",
        surfaceColor: SURFACES.light,
        includeTypography: false,
        includeElevations: false,
        includeSpacing: false,
      });
    });

    it.each(
      cartesian({ platform: PLATFORMS, output: OUTPUTS }),
    )("$platform / $output with a custom font family", async ({
      platform,
      output,
    }) => {
      await expectCompiles("create_theme", {
        platform,
        output,
        primaryColor: "#7b2cbf",
        secondaryColor: "#ff9e00",
        surfaceColor: SURFACES.light,
        fontFamily: "'Inter', sans-serif",
      });
    });
  });

  describe("create_component_theme", () => {
    const cases = cartesian({
      platform: PRODUCT_PLATFORMS,
      designSystem: DESIGN_SYSTEMS,
      variant: VARIANTS,
      output: OUTPUTS,
      component: ["flat-button", "avatar"],
    });

    it.each(
      cases,
    )("$component / $platform / $designSystem / $variant / $output", async ({
      platform,
      designSystem,
      variant,
      output,
      component,
    }) => {
      await expectCompiles("create_component_theme", {
        platform,
        designSystem,
        variant,
        output,
        component,
        tokens: { background: "#7b2cbf" },
      });
    });
  });

  describe("create_palette", () => {
    it.each(
      cartesian({ platform: PLATFORMS, variant: VARIANTS, output: OUTPUTS }),
    )("$platform / $variant / $output", async ({
      platform,
      variant,
      output,
    }) => {
      await expectCompiles("create_palette", {
        platform,
        variant,
        output,
        primary: "#7b2cbf",
        secondary: "#ff9e00",
        surface: SURFACES[variant],
      });
    });
  });

  describe("create_custom_palette", () => {
    it.each(
      cartesian({
        platform: PLATFORMS,
        designSystem: DESIGN_SYSTEMS,
        variant: VARIANTS,
        output: OUTPUTS,
      }),
    )("$platform / $designSystem / $variant / $output", async ({
      platform,
      designSystem,
      variant,
      output,
    }) => {
      await expectCompiles("create_custom_palette", {
        platform,
        designSystem,
        variant,
        output,
        primary: { mode: "shades", baseColor: "#7b2cbf" },
        secondary: { mode: "shades", baseColor: "#ff9e00" },
        surface: { mode: "shades", baseColor: SURFACES[variant] },
      });
    });
  });

  describe("create_typography", () => {
    it.each(
      cartesian({
        platform: PLATFORMS,
        designSystem: DESIGN_SYSTEMS,
        output: OUTPUTS,
      }),
    )("$platform / $designSystem / $output", async ({
      platform,
      designSystem,
      output,
    }) => {
      await expectCompiles("create_typography", {
        platform,
        designSystem,
        output,
        fontFamily: "'Inter', sans-serif",
      });
    });
  });

  describe("create_elevations", () => {
    it.each(
      cartesian({
        platform: PLATFORMS,
        designSystem: ["material", "indigo"],
        output: OUTPUTS,
      }),
    )("$platform / $designSystem / $output", async ({
      platform,
      designSystem,
      output,
    }) => {
      await expectCompiles("create_elevations", {
        platform,
        designSystem,
        output,
      });
    });
  });

  describe("layout tools", () => {
    const layoutCases = cartesian({
      platform: PLATFORMS,
      output: OUTPUTS,
      scope: ["global", "component"],
    }).filter((c) => !(c.platform === "generic" && c.scope === "component"));

    const scopeArgs = (scope: string) =>
      scope === "component" ? { component: "avatar" } : {};

    it.each(layoutCases)("set_size $platform / $output / $scope", async ({
      platform,
      output,
      scope,
    }) => {
      await expectCompiles("set_size", {
        platform,
        output,
        size: "small",
        ...scopeArgs(scope),
      });
    });

    it.each(layoutCases)("set_spacing $platform / $output / $scope", async ({
      platform,
      output,
      scope,
    }) => {
      await expectCompiles("set_spacing", {
        platform,
        output,
        spacing: 0.75,
        ...scopeArgs(scope),
      });
    });

    it.each(layoutCases)("set_roundness $platform / $output / $scope", async ({
      platform,
      output,
      scope,
    }) => {
      await expectCompiles("set_roundness", {
        platform,
        output,
        radiusFactor: 0.5,
        ...scopeArgs(scope),
      });
    });
  });
});

describe("handler failures are flagged with isError", () => {
  it.each(
    OUTPUTS,
  )("create_palette with an invalid color (%s)", async (output) => {
    const { isError, text } = await callTool("create_palette", {
      platform: "webcomponents",
      output,
      primary: "notacolor",
      secondary: "#ff9e00",
      surface: "#ffffff",
    });

    expect(isError, text).toBe(true);
  });

  it.each(
    OUTPUTS,
  )("create_theme with an invalid color (%s)", async (output) => {
    const { isError, text } = await callTool("create_theme", {
      platform: "webcomponents",
      output,
      primaryColor: "notacolor",
      secondaryColor: "#ff9e00",
      surfaceColor: "#ffffff",
    });

    expect(isError, text).toBe(true);
  });

  it.each(
    OUTPUTS,
  )("create_custom_palette with an invalid color (%s)", async (output) => {
    const { isError, text } = await callTool("create_custom_palette", {
      platform: "webcomponents",
      output,
      primary: { mode: "shades", baseColor: "notacolor" },
      secondary: { mode: "shades", baseColor: "#ff9e00" },
      surface: { mode: "shades", baseColor: "#ffffff" },
    });

    expect(isError, text).toBe(true);
  });

  // Sass output isn't compiled by the handler, so only CSS output can fail here
  it("create_component_theme with an invalid token value (css)", async () => {
    const { isError, text } = await callTool("create_component_theme", {
      platform: "webcomponents",
      output: "css",
      component: "avatar",
      tokens: { background: "notacolor(" },
    });

    expect(isError, text).toBe(true);
  });
});
