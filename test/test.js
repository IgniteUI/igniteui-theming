const path = require('path');
const sassTrue = require('sass-true');

const sassFile = path.join(__dirname, '_index.scss');

sassTrue.runSass(
  { describe, it },
  sassFile,
  { loadPaths: ['node_modules'] }
);
