/**
 * Serves the embed test pages under `/pages/` on the dev server, and writes them next to
 * the bundle in the embed build. Nothing is generated into the source tree.
 */
import type { Plugin } from "vite";
import { PAGES_DIR, renderAll } from "./render.js";

const ROUTE = "/pages/";

/** The dev server compiles the embed entry from source. */
const DEV_SCRIPT = "/src/embed/index.ts";

export const embedPages = ({ emit = false } = {}): Plugin => ({
  name: "ig-embed-pages",

  configureServer(server) {
    server.watcher.add(PAGES_DIR);
    server.watcher.on("all", (_, file) => {
      if (file.startsWith(PAGES_DIR)) server.ws.send({ type: "full-reload" });
    });

    server.middlewares.use(async (req, res, next) => {
      const url = (req.url ?? "").split("?")[0];

      // The pages link relatively, so the folder needs its slash.
      if (url === ROUTE.slice(0, -1)) {
        res.writeHead(301, { Location: ROUTE }).end();
        return;
      }
      if (!url.startsWith(ROUTE)) return next();

      const path = url.slice(ROUTE.length) || "index.html";

      try {
        const pages = await renderAll(() => DEV_SCRIPT);
        const page = pages.get(path);

        // Not the app's index.html, which is what Vite would fall back to.
        if (!page) {
          res.statusCode = 404;
          res.end(`No page at ${url}. See ${ROUTE}`);
          return;
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(await server.transformIndexHtml(url, page));
      } catch (error) {
        next(error);
      }
    });
  },

  async generateBundle() {
    if (!emit) return;

    // `embed.js` sits at the root of the output; each page reaches it relatively.
    const pages = await renderAll(
      (path) => `${"../".repeat(path.split("/").length)}embed.js`,
    );

    for (const [path, source] of pages) {
      this.emitFile({ type: "asset", fileName: `pages/${path}`, source });
    }
  },
});
