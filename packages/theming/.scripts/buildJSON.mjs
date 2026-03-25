import { exec as _exec } from "node:child_process";
import { mkdirSync as makeDir, readdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import * as sass from "sass-embedded";
import { parseCSS } from "./parser.mjs";
import report from "./report.mjs";

const exec = promisify(_exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const SASS_JSON_DIR = path.join(PACKAGE_ROOT, "sass", "json");
const DEST_DIR = path.join.bind(null, path.resolve(PACKAGE_ROOT, "dist/json"));

(async () => {
  const start = performance.now();
  const compiler = await sass.initAsyncCompiler();

  await exec("npm run clean:json");
  report.info("Building JSON files...");

  // Generate JSON files from Sass
  const scssFiles = readdirSync(SASS_JSON_DIR)
    .filter((f) => f.endsWith(".scss"))
    .map((f) => path.join(SASS_JSON_DIR, f));

  for (const src of scssFiles) {
    const { css } = await compiler.compileAsync(src, {
      loadPaths: [path.join(PACKAGE_ROOT, "sass")],
      silenceDeprecations: ["color-functions"],
    });

    for (const [out, data] of Object.entries(await parseCSS(css))) {
      const outputFile = DEST_DIR(`${out}.json`);
      makeDir(path.dirname(outputFile), { recursive: true });
      await writeFile(outputFile, JSON.stringify(data), "utf-8");
    }
  }

  report.success(
    `Built JSON in ${((performance.now() - start) / 1000).toFixed(2)}s`,
  );
  compiler.dispose();
})();
