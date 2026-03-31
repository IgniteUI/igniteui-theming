import {resolve} from 'node:path';
import {defineConfig} from 'vitest/config';

const ALIAS_PATHS = {
  theming: resolve(__dirname, 'packages/theming'),
  mcp: resolve(__dirname, 'packages/mcp'),
  dtcg: resolve(__dirname, 'packages/dtcg'),
};

export default defineConfig({
  resolve: {
    alias: ALIAS_PATHS,
  },
  test: {
    projects: [
      'packages/theming',
      'packages/mcp',
    ],
  },
});
