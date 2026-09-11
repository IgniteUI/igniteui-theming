import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "preview",
    include: ["src/**/*.spec.ts"],
    environment: "node",
    testTimeout: 20000,
  },
});
