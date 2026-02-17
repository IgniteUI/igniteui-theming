import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sassTrue from 'sass-true';
import {describe, it} from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sassFile = path.join(__dirname, '_index.scss');

sassTrue.runSass({describe, it}, sassFile, {loadPaths: ['node_modules']});
