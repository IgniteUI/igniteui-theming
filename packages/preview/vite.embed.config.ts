/**
 * The article embeds: `dist-embed/embed.js` plus a standalone page per demo for
 * platforms that only take iframes. `npm run build:embed`.
 *
 *   dist-embed/
 *     embed.js           load once, then use <ig-demo-*> tags
 *     chunks/            each demo's code and data, fetched when it nears the viewport
 *     frames/<demo>.html one demo per page, for <iframe src>
 *     frames/resize.js   optional: sizes those iframes to their content
 *     pages/             the test pages from pages/: every article, every demo under a
 *                        hostile stylesheet, and an index (see src/pages/)
 *
 * Every URL inside is relative, so the folder can be hosted under any path.
 */
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { dataProviders } from "./src/data/plugin.js";
import { DEMO_NAMES } from "./src/embed/catalog.js";
import { embedPages } from "./src/pages/plugin.js";

const frame = (demo: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Ignite UI Theming — ${demo}</title>
    <style>
      html, body { margin: 0; background: transparent; }
      body { padding: 1px; }
    </style>
    <script type="module" src="../embed.js"></script>
  </head>
  <body>
    <ig-demo-${demo} frame></ig-demo-${demo}>
    <script>
      // ?scheme=light|dark pins the demo's colors; otherwise it follows the system.
      const scheme = new URLSearchParams(location.search).get("scheme");
      if (scheme === "light" || scheme === "dark") {
        document.querySelector("ig-demo-${demo}").setAttribute("scheme", scheme);
        document.documentElement.dataset.theme = scheme;
      }
    </script>
  </body>
</html>
`;

/** Listens for the frames' height reports and sizes the iframe that sent each one. */
const RESIZE = `addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "ig-demo:height") return;
  for (const frame of document.querySelectorAll("iframe")) {
    if (frame.contentWindow === event.source) frame.style.height = data.height + "px";
  }
});
`;

const framePages = (): Plugin => ({
  name: "ig-demo-frames",
  generateBundle() {
    for (const demo of DEMO_NAMES) {
      this.emitFile({
        type: "asset",
        fileName: `frames/${demo}.html`,
        source: frame(demo),
      });
    }
    this.emitFile({
      type: "asset",
      fileName: "frames/resize.js",
      source: RESIZE,
    });
  },
});

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [dataProviders(), framePages(), embedPages({ emit: true })],
  build: {
    outDir: "dist-embed",
    emptyOutDir: true,
    lib: {
      entry: "src/embed/index.ts",
      formats: ["es"],
      fileName: () => "embed.js",
    },
    rolldownOptions: {
      output: { chunkFileNames: "chunks/[name]-[hash].js" },
    },
  },
});
