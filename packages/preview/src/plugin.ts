import type { OutputAsset } from "rolldown";
import type { Plugin } from "vite";
import { stringify } from "./html.js";
import { build } from "./model.js";
import { sections } from "./render.js";

/**
 * Compiles the palettes and fills the placeholders in index.html. The generated
 * `--ig-*` declarations are injected as a stylesheet so the page paints from the same
 * custom properties a consumer receives.
 */
export const previewData = (): Plugin => ({
  name: "preview-data",
  transformIndexHtml: {
    order: "pre",
    handler(template) {
      const model = build();
      const parts = sections(model);

      const filled = template.replace(
        /<!--\s*@([a-z]+)\s*-->/g,
        (match, key: string) => (key in parts ? stringify(parts[key]) : match),
      );

      return {
        html: filled,
        tags: [{ tag: "style", children: model.css, injectTo: "head-prepend" }],
      };
    },
  },
});

/**
 * Folds the emitted stylesheet back into the HTML so the build is a single file that
 * opens from disk. A linked asset carries `crossorigin`, which a browser refuses to
 * fetch over `file://`, and this page is meant to be opened and passed around.
 */
export const singleFile = (): Plugin => ({
  name: "preview-single-file",
  enforce: "post",
  generateBundle(_options, bundle) {
    const css = Object.values(bundle).filter(
      (chunk): chunk is OutputAsset =>
        chunk.type === "asset" && chunk.fileName.endsWith(".css"),
    );

    for (const page of Object.values(bundle)) {
      if (page.type !== "asset" || !page.fileName.endsWith(".html")) continue;

      page.source = css.reduce(
        (html, asset) =>
          html.replace(
            new RegExp(
              `<link[^>]+href="[^"]*${asset.fileName.replace(/[.*+?^$()|[\]\\]/g, "\\$&")}"[^>]*>`,
            ),
            `<style>${asset.source}</style>`,
          ),
        String(page.source),
      );
    }

    for (const asset of css) delete bundle[asset.fileName];
  },
});
