import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{test,spec}.ts"],
    exclude: ["dist/**", "node_modules/**"],
    environment: "node",
    globals: false,
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      include: ["tests/**/*.ts"],
      exclude: [
        "dist",
        "node_modules/**",
        "**/*.test.ts",
        "**/*.spec.ts",
        "src/index.ts",
      ],
    },
  },
});
