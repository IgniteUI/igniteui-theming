import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{test,spec}.ts"],
    exclude: ["dist/**", "node_modules/**"],
    environment: "node",
    globals: false,
    testTimeout: 10000, // 10s for Sass compilation tests
    coverage: {
      provider: "v8",
      include: ["**/*.ts"],
      exclude: [
        "dist/**",
        "node_modules/**",
        "**/*.test.ts",
        "**/*.spec.ts",
        "vitest.config.ts",
      ],
    },
  },
});
