import postcss from 'postcss';
import safeParser from 'postcss-safe-parser';
import report from './report.mjs';

// Remove surrounding quotes from a string
function removeQuotes(string) {
  if (string.startsWith('"') && string.endsWith('"')) {
    return string.substring(1, string.length - 1);
  }
  return string;
}

// Parse a value, converting array-like strings to arrays
function parseValue(value) {
  value = removeQuotes(value.trim());
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .substring(1, value.length - 1)
      .split(',')
      .map((item) => item.trim());
  }
  return value;
}

// Handle declaration processing
function processDeclaration(decl, object) {
  const propName = decl.prop.replace('--', '');
  const value = parseValue(decl.value);
  object[propName] = value;
}

function setOutputPaths(map, data) {
  const result = {};

  Object.keys(data).forEach((key) => {
    const newKey = map[key];

    if (newKey) {
      result[newKey] = data[key];
    }
  });

  return result;
}

// Build the JSON structure based on the CSS input
async function parseCSS(css) {
  let resultJSON = {};
  let outputDirs = {};

  try {
    const result = await postcss().process(css, {parser: safeParser, from: undefined});
    let comment = '';

    result.root.walk((node) => {
      if (node.type === 'comment') {
        comment = node.text;
      }

      if (node.type === 'rule') {
        let currentObj = resultJSON;
        const outputDirMatch = comment.match(/@outputDir - (.*)/);
        const selectorPath = node.selector.replace(/\s*>\s*/g, '>').split('>');

        if (outputDirMatch) {
          outputDirs[selectorPath[0]] = `${outputDirMatch[1].trim()}/${selectorPath[0]}` || {};
        }

        selectorPath.forEach((part) => {
          currentObj[part] = currentObj[part] || {};
          currentObj = currentObj[part];
        });

        node.walkDecls((decl) => {
          return processDeclaration(decl, currentObj);
        });
      }
    });

    return setOutputPaths(outputDirs, resultJSON);
  } catch (err) {
    report.error(err);
    return {};
  }
}

export {parseCSS};
