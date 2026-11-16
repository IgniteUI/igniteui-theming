import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "sass-graph",
    include: ["src/**/*.spec.ts"],
    environment: "node",
  },
});
