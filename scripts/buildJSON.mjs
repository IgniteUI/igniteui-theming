import path from "path";
import { exporter } from "sass-export";
import { exec as _exec } from "child_process";
import { mkdirSync as makeDir } from "fs";
import { writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { globby } from "globby";

const exec = promisify(_exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PALETTE_PRESETS = "sass/color/presets";
const DEST_DIR = path.join.bind(null, path.resolve(__dirname, "../json"));

async function palettesToJSON() {
  const paths = await globby(`${PALETTE_PRESETS}/{light,dark}/*.scss`);
  const palettes = {
    inputFiles: paths,
    includePaths: [`${PALETTE_PRESETS}/light/`, `${PALETTE_PRESETS}dark/`],
  };
  const p = exporter(palettes).getStructured();
  const outputFile = DEST_DIR("palettes.json");
  makeDir(path.dirname(outputFile), { recursive: true });
  writeFile(outputFile, JSON.stringify(p), "utf-8");
}

async function colorsToJSON() {
  const options = {
    inputFiles: ["sass/color/_types.scss", "sass/color/_multipliers.scss"],
  };
  const colors = exporter(options).getArray();
  const outputFile = DEST_DIR("colors.json");
  makeDir(path.dirname(outputFile), { recursive: true });
  writeFile(outputFile, JSON.stringify(colors), "utf-8");
}

(async () => {
  await exec("npm run clean");

  console.info("Building JSON palettes...");
  await palettesToJSON();

  console.info("Building JSON colors...");
  await colorsToJSON();

  console.log(`Done! 🎉`);
})();
