import { compile } from 'sass';
import path from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input and output
const inputFile = path.resolve(__dirname, '../sass/tailwind/theme.scss');
const outputDir = path.resolve(__dirname, '../tailwind');
const outputFile = path.join(outputDir, 'theme.css');

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

// Compile SCSS
const { css } = compile(inputFile, {
  loadPaths: ['sass'],
  style: 'expanded',
});

// Write to output file
writeFileSync(outputFile, css, 'utf-8');

console.log(`✅ compiled tailwind theme`);
