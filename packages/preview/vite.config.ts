import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { previewData, singleFile } from "./src/plugin.js";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [previewData(), singleFile()],
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
});
