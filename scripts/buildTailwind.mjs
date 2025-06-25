import { compile } from 'sass';
import path from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { globby } from 'globby';
import report from './report.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const inputFile = path.resolve(__dirname, '../sass/tailwind/theme.scss');
const outputDir = path.resolve(__dirname, '../tailwind');
const outputFile = path.join(outputDir, 'theme.css');

const presetsInputDir = path.resolve(__dirname, '../sass/tailwind/presets');
const presetsOutputDir = path.resolve(__dirname, '../tailwind/presets');

// Ensure output directories exist
mkdirSync(outputDir, { recursive: true });
mkdirSync(presetsOutputDir, { recursive: true });

// Compile main theme.scss
const { css } = compile(inputFile, {
  loadPaths: ['sass'],
  style: 'compressed',
});
writeFileSync(outputFile, css, 'utf-8');
report.success('compiled tailwind theme');

// Compile all presets
const presetFiles = await globby(`${presetsInputDir}/**/*.scss`);

for (const file of presetFiles) {
  const relativePath = path.relative(presetsInputDir, file);
  const outputPath = path.join(presetsOutputDir, relativePath.replace(/\.scss$/, '.css'));

  // Ensure output subfolder exists
  mkdirSync(path.dirname(outputPath), { recursive: true });

  const { css } = compile(file, {
    loadPaths: ['sass'],
    style: 'compressed',
  });

  writeFileSync(outputPath, css, 'utf-8');
}
