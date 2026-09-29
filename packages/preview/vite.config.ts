import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { dataProviders } from "./src/data/plugin.js";
import { embedPages } from "./src/pages/plugin.js";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // The embed test pages under /pages/, rendered on request.
  plugins: [dataProviders(), embedPages()],
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
});
