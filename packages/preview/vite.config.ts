import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { dataProviders } from "./src/data/plugin.js";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [dataProviders()],
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
});
