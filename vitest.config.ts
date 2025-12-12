import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    include: ['**/*.{test,spec}.ts'],
    environment: 'node',
    globals: false,
    testTimeout: 10000, // 10s for Sass compilation tests
    coverage: {
      provider: 'v8',
      include: ['**/*.ts'],
      exclude: ['dist', '**/*.test.ts', '**/*.spec.ts', 'index.ts'],
    },
  },
});
