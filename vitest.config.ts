import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/theming",
      "packages/mcp",
      "packages/plugins",
    ],
  },
});
