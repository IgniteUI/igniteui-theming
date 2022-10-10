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
const TYPOGRAPHY_PRESETS = "sass/typography/presets";
const ELEVATION_PRESETS = "sass/elevations/presets";
const DEST_DIR = path.join.bind(null, path.resolve(__dirname, "../json"));

async function palettesToJSON() {
  const paths = await globby(`${PALETTE_PRESETS}/{light,dark}/*.scss`);
  const palettes = {
    inputFiles: paths,
    includePaths: [`${PALETTE_PRESETS}/light/`, `${PALETTE_PRESETS}/dark/`],
  };
  const data = exporter(palettes).getStructured();
  const outputFile = DEST_DIR("colors/presets/palettes.json");
  const normalized = Object.entries(data).reduce((acc, next) => {
    const [key, value] = next;
    if (key !== "variables") {
      value.forEach((palette) => {
        acc[`${key}-${palette.name.substring(1)}`] = palette.mapValue.reduce((acc, color) => {
          if (color.name === "variant") return acc;
          acc[color.name] = color.value;
          return acc;
        }, {});
      });
    }
    return acc;
  }, {});
  makeDir(path.dirname(outputFile), { recursive: true });
  writeFile(outputFile, JSON.stringify(normalized), "utf-8");
}

async function typographyToJSON() {
  const paths = await globby(`${TYPOGRAPHY_PRESETS}/*.scss`);
  const presets = {
    inputFiles: paths,
    includePaths: [`${TYPOGRAPHY_PRESETS}`],
  };
  const data = exporter(presets).getStructured();
  const normalized = Object.entries(data).reduce((acc, next) => {
    const [key, value] = next;
    if (key !== "variables") {
      acc[key] = value.reduce((styles, variable) => {
        if (variable.name !== "$type-scale" && variable.name !== "$_base-scale") {
          styles[variable.name.substring(1)] =
            variable.mapValue?.reduce((acc, next) => {
              acc[next.name] = next.compiledValue;
              return acc;
            }, {}) || variable.value;
        }
        return styles;
      }, {});
    }
    return acc;
  }, {});
  const outputFile = DEST_DIR("typography/presets/typescales.json");
  makeDir(path.dirname(outputFile), { recursive: true });
  writeFile(outputFile, JSON.stringify(normalized), "utf-8");
}

async function colorsToJSON() {
  const options = {
    inputFiles: ["sass/color/_types.scss", "sass/color/_multipliers.scss"],
  };
  const data = exporter(options).getArray();
  const color = data.find((d) => d.name === "$color").mapValue;
  const grayscale = data.find((d) => d.name === "$grayscale").mapValue;
  const color_s = color.find((d) => d.name === "s").mapValue;
  const color_l = color.find((d) => d.name === "l").mapValue;
  const grayscale_l = grayscale.find((d) => d.name === "l").mapValue;
  const gray_shades = data.find((d) => d.name === "$IGrayShades").compiledValue.split(/\s*,\s*/);
  const color_shades = data.find((d) => d.name === "$IColorShades").compiledValue.split(/\s*,\s*/);

  const multipliers = {
    color: {
      s: color_s.reduce((acc, next) => {
        acc[next.name] = next.value;
        return acc;
      }, {}),
      l: color_l.reduce((acc, next) => {
        acc[next.name] = next.value;
        return acc;
      }, {}),
    },
    grayscale: {
      l: grayscale_l.reduce((acc, next) => {
        acc[next.name] = next.value;
        return acc;
      }, {}),
    },
  };
  const palette = data
    .find((d) => d.name === "$IPaletteColors")
    .mapValue.reduce((acc, next) => {
      if (next.name === "gray") {
        acc[next.name] = gray_shades;
        return acc;
      }

      acc[next.name] = color_shades;
      return acc;
    }, {});

  const multipliersFile = DEST_DIR("colors/meta/multipliers.json");
  const paletteFile = DEST_DIR("colors/meta/palette.json");

  makeDir(path.dirname(multipliersFile), { recursive: true });
  makeDir(path.dirname(paletteFile), { recursive: true });

  writeFile(multipliersFile, JSON.stringify(multipliers), "utf-8");
  writeFile(paletteFile, JSON.stringify(palette), "utf-8");
}

async function elevationsToJSON() {
  const paths = await globby(`${ELEVATION_PRESETS}/*.scss`);
  const options = {
    inputFiles: paths,
    includePaths: [`${ELEVATION_PRESETS}`],
  };
  const presets = exporter(options).getStructured();
  const data = Object.entries(presets).filter(([key]) => key !== "variables" && key !== "mixins");
  const elevations = data.reduce((acc, [key, value]) => {
    acc[key] = value.reduce((acc, next) => {
      if(next.name === '$elevations') {
        acc.elevations = next.mapValue.reduce((result, elevation) => {
          result[elevation.name] = elevation.compiledValue;
          return result;
        }, {});
      }
      return acc;
    }, {});
    return acc;
  }, {});

  const outputFile = DEST_DIR("elevations/elevations.json");
  makeDir(path.dirname(outputFile), { recursive: true });

  writeFile(outputFile, JSON.stringify(elevations), "utf-8");
}

(async () => {
  await exec("npm run clean");

  console.info("Exporting palette presets to JSON...");
  await palettesToJSON();

  console.info("Exporting color metadata to JSON...");
  await colorsToJSON();

  console.info("Exporting typography presets to JSON...");
  await typographyToJSON();

  console.info("Exporting elevation presets to JSON...");
  await elevationsToJSON();

  console.log(`Done! 🎉`);
})();
