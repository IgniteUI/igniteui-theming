import { mkdirSync, writeFileSync } from "node:fs";
import { glob } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass-embedded";
import report from "./report.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SASS_CONFIG = {
  loadPaths: ["sass"],
  style: "compressed",
  silenceDeprecations: ["color-functions"],
};

const BUILD_CONFIGS = [
  {
    name: "themes",
    inputDir: path.resolve(__dirname, "../src/tailwind/themes"),
    outputDir: path.resolve(__dirname, "../dist/tailwind/themes"),
  },
  {
    name: "utilities",
    inputDir: path.resolve(__dirname, "../src/tailwind/utilities"),
    outputDir: path.resolve(__dirname, "../dist/tailwind/utilities"),
  },
];

/**
 * Compiles all SCSS files in a directory, excluding files starting with underscore
 */
async function compileSass(inputDir, outputDir) {
  mkdirSync(outputDir, { recursive: true });

  const files = [];
  for await (const file of glob(`${inputDir}/**/*.scss`)) {
    if (!path.basename(file).startsWith("_")) {
      files.push(file);
    }
  }
  const compiler = await sass.initAsyncCompiler();

  for (const file of files) {
    const relativePath = path.relative(inputDir, file);
    const outputPath = path.join(
      outputDir,
      relativePath.replace(/\.scss$/, ".css"),
    );

    const { css } = await compiler.compileAsync(file, SASS_CONFIG);

    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, css, "utf-8");
  }

  compiler.dispose();
  return files.length;
}

async function build() {
  for (const config of BUILD_CONFIGS) {
    try {
      const start = performance.now();
      const filesCompiled = await compileSass(
        config.inputDir,
        config.outputDir,
      );
      report.success(
        `Built ${filesCompiled} tailwind ${config.name} files in ${((performance.now() - start) / 1000).toFixed(2)}s`,
      );
    } catch (error) {
      report.error(`Failed to build ${config.name}: ${error.message}`);
      process.exit(1);
    }
  }
}

await build();
