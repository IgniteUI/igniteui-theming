import { compile } from 'sass';
import path from 'path';
import { mkdirSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input and output
const inputFile = path.resolve(__dirname, '../sass/tailwind/theme.scss');
const outputDir = path.resolve(__dirname, '../tailwind');
const outputFile = path.join(outputDir, 'theme.css');

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

// Compile main theme.scss
const { css } = compile(inputFile, {
  loadPaths: ['sass'],
  style: 'expanded',
});
writeFileSync(outputFile, css, 'utf-8');
console.log(`✅ compiled tailwind theme`);

// Compile all presets
const presetsInputDir = path.resolve(__dirname, '../sass/tailwind/presets');
const presetsOutputDir = path.resolve(__dirname, '../tailwind/presets');

// Ensure output directory exists
mkdirSync(presetsOutputDir, { recursive: true });

// Get all .scss files in presets folder
const presetFiles = readdirSync(presetsInputDir).filter(file => file.endsWith('.scss'));

presetFiles.forEach(file => {
  const inputPath = path.join(presetsInputDir, file);
  const outputPath = path.join(presetsOutputDir, file.replace(/\.scss$/, '.css'));

  const { css } = compile(inputPath, {
    loadPaths: ['sass'],
    style: 'expanded',
  });

  writeFileSync(outputPath, css, 'utf-8');
});
