import path from 'path';
import * as sass from 'sass-embedded';
import {exec as _exec} from 'child_process';
import {mkdirSync as makeDir} from 'fs';
import {writeFile} from 'fs/promises';
import {fileURLToPath} from 'url';
import {promisify} from 'util';
import {globby} from 'globby';
import {parseCSS} from './parser.mjs';
import report from './report.mjs';

const exec = promisify(_exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST_DIR = path.join.bind(null, path.resolve(__dirname, '../json'));

(async () => {
  const start = performance.now();
  const compiler = await sass.initAsyncCompiler();

  await exec('npm run clean:json');
  report.info('Building JSON files...');

  // Generate JSON files from Sass
  for (const src of await globby(['sass/json/*.scss'])) {
    const {css} = await compiler.compileAsync(src, {
      loadPaths: ['sass'],
      silenceDeprecations: ['color-functions'],
    });

    for (const [out, data] of Object.entries(await parseCSS(css))) {
      const outputFile = DEST_DIR(`${out}.json`);
      makeDir(path.dirname(outputFile), {recursive: true});
      writeFile(outputFile, JSON.stringify(data), 'utf-8');
    }
  }

  report.success(`Built JSON in ${((performance.now() - start) / 1000).toFixed(2)}s`);
  compiler.dispose();
})();
