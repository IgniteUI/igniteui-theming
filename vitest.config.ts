import {resolve} from 'node:path';
import {defineConfig} from 'vitest/config';

const ALIAS_PATHS = {
  theming: resolve(__dirname, 'packages/theming'),
  mcp: resolve(__dirname, 'packages/mcp'),
};

export default defineConfig({
  resolve: {
    alias: ALIAS_PATHS,
  },
  test: {
    projects: [
      'packages/theming',
      'packages/mcp',
      {
        resolve: {
          alias: ALIAS_PATHS,
        },
        test: {
          name: 'integration',
          include: ['tests/**/*.test.ts'],
          testTimeout: 15_000,
          environment: 'node',
        },
      },
    ],
  },
});
