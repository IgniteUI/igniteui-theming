import sassdoc from 'sassdoc';
import {writeFile, mkdir} from 'fs/promises';
import report from './report.mjs';

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
    const componentName = fn.context.name.replace(/-theme$/, '');

    components[componentName] = {
      name: componentName,
      themeFunctionName: fn.context.name,
      description: fn.description || '',
      tokens: (fn.parameter || [])
        .filter((p) => p.name !== 'schema')
        .map((p) => ({
          name: p.name,
          type: p.type || 'unknown',
          description: p.description || '',
        })),
    };
  }

  await mkdir('./json/components', {recursive: true});
  await writeFile('./json/components/themes.json', JSON.stringify(components, null, 2));

  report.info(`Extracted ${Object.keys(components).length} component themes`);
}
extractComponentThemes();
