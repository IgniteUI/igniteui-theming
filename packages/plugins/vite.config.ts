import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "@bagrajs/core",
        "unist-util-visit",
        "sass-embedded",
        "immutable",
      ],
    },
  },
  plugins: [dts({ rollupTypes: false })],
});
