import sassdoc from 'sassdoc';
import {writeFile, mkdir} from 'fs/promises';
import report from './report.mjs';

/**
 * TODO: Ideally, all parts of the description would be structured in SassDoc via custom annotations.
 * For now we have a convention of writing the PRIMARY TOKENS list in the description text.
 * This function parses that convention.
 * Parses the SassDoc description to extract PRIMARY TOKENS into structured data.
 * Returns { title, primaryTokens, summary } where:
 * - title: the first line (e.g., "Calendar Theme")
 * - primaryTokens: array of { name, description } from the PRIMARY TOKENS block
 * - summary: any remaining non-token prose after the tokens list
 */
function parsePrimaryTokens(rawDescription) {
  if (!rawDescription || !rawDescription.trim()) {
    return {title: '', primaryTokens: [], summary: ''};
  }

  const text = rawDescription.trim();
  const primaryMarkerIndex = text.indexOf('PRIMARY TOKENS');

  // No PRIMARY TOKENS block — return everything as title
  if (primaryMarkerIndex === -1) {
    return {title: text, primaryTokens: [], summary: ''};
  }

  const title = text.slice(0, primaryMarkerIndex).trim();

  // Everything after the marker line
  const afterMarker = text.slice(primaryMarkerIndex);
  // Skip the "PRIMARY TOKENS..." header line itself
  const lines = afterMarker.split('\n');
  const contentLines = lines.slice(1); // skip "PRIMARY TOKENS (set these first...):" line

  const primaryTokens = [];
  let summaryLines = [];
  let parsingTokens = true;

  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i].trim();

    if (parsingTokens && line.startsWith('- `$')) {
      // Token line: - `$name` - description (may continue on next lines)
      const tokenMatch = line.match(/^- `\$([^`]+)`\s*[-—]\s*(.+)$/);

      if (tokenMatch) {
        let desc = tokenMatch[2];

        // Gather continuation lines (indented, not starting with -)
        while (i + 1 < contentLines.length) {
          const nextLine = contentLines[i + 1].trim();

          if (nextLine && !nextLine.startsWith('- `$') && !nextLine.startsWith('-')) {
            // Looks like a continuation of the same token description
            // But only if it doesn't look like a summary sentence
            if (
              nextLine.match(/^[a-z]/i) &&
              !nextLine.startsWith('Setting') &&
              !nextLine.startsWith('If ') &&
              !nextLine.startsWith('For ') &&
              !nextLine.startsWith('Does ') &&
              !nextLine.startsWith('Toggle') &&
              !nextLine.startsWith('Text') &&
              !nextLine.startsWith('Behavior')
            ) {
              desc += ' ' + nextLine;
              i++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        primaryTokens.push({name: tokenMatch[1], description: desc.trim()});
      }
    } else if (line === '') {
      // Empty line — could be separator between tokens and summary
      if (parsingTokens && primaryTokens.length > 0) {
        parsingTokens = false;
      }
    } else if (!parsingTokens || (parsingTokens && primaryTokens.length > 0 && !line.startsWith('- `$'))) {
      parsingTokens = false;
      if (line) {
        summaryLines.push(line);
      }
    }
  }

  return {
    title,
    primaryTokens,
    summary: summaryLines.join(' ').trim(),
  };
}

function convertParamsToTokens(params = []) {
  return params
    .filter((p) => p.name !== 'schema')
    .map((p) => ({
      name: p.name,
      type: p.type || 'unknown',
      description: p.description || '',
    }));
}

async function extractComponentThemes() {
  const data = await sassdoc.parse('./sass/themes/components/**/*-theme.scss', {
    verbose: false,
  });

  // Filter to theme functions only
  const themeFunctions = data.filter(
    (item) => item.context.type === 'function' && item.context.name.endsWith('-theme'),
  );

  const components = {};

  for (const fn of themeFunctions) {
    // This is an alias to another theme function;
    // Get the parameters from the alias
    if (!fn.parameter && fn.alias) {
      const alias = data.find((item) => item.context.name === fn.alias);

      if (alias) {
        fn.parameter = alias.parameter;
      }
    }

    const componentName = fn.context.name.replace(/-theme$/, '');

    const parsed = parsePrimaryTokens(fn.description || '');

    components[componentName] = {
      name: componentName,
      themeFunctionName: fn.context.name,
      description: parsed.title,
      primaryTokens: parsed.primaryTokens,
      primaryTokensSummary: parsed.summary || undefined,
      tokens: convertParamsToTokens(fn.parameter),
    };
  }

  await mkdir('./json/components', {recursive: true});
  await writeFile('./json/components/themes.json', JSON.stringify(components, null, 2));

  report.info(`Extracted ${Object.keys(components).length} component themes`);
}

extractComponentThemes();
