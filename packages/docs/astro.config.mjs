// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { unified } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import remarkAdmonitions from './src/lib/markdown/remark-admonitions.ts';
import remarkHeadingIds from './src/lib/markdown/remark-heading-ids.ts';
import rehypeHeadingLinks from './src/lib/markdown/rehype-heading-links.ts';
import rehypeShiki from '@shikijs/rehype';
import { transformerNotationHighlight } from '@shikijs/transformers';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * Shiki setup: Ayu light/dark themes, plus the `json`, `javascript` and `typescript` aliases the content
 * uses in fences.
 * @type {import('@shikijs/rehype').RehypeShikiOptions}
 */
const shikiOptions = {
  themes: {
    light: 'ayu-light',
    dark: 'ayu-dark',
  },
  inline: 'tailing-curly-colon',
  langs: [
    'bash',
    'css',
    'html',
    'js',
    'javascript',
    'json',
    'jsonc',
    'jsx',
    'sass',
    'scss',
    'shellscript',
    'ts',
    'typescript',
    'tsx',
  ],
  transformers: [transformerNotationHighlight()],
};

/**
 * `import X from '@/components/Samples/<Name>'` (the MDX import lines) resolves to the
 * `index.astro` wrapper, which hydrates the React sample in `index.tsx` as an island.
 * @type {import('vite').Plugin}
 */
const samplesAstroWrapper = {
  name: 'samples-astro-wrapper',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (!/(?:^|\/)components\/Samples\/[A-Za-z]+$/.test(source)) return null;
    return this.resolve(`${source}/index.astro`, importer, {
      ...options,
      skipSelf: true,
    });
  },
};

// https://astro.build/config
export default defineConfig({
  // Every route lives under /theming-docs.
  site: 'https://staging.infragistics.com',
  base: '/theming-docs',
  trailingSlash: 'ignore',
  // Prefetch same-origin links on hover; with cross-document view transitions the next page is then cached.
  prefetch: { prefetchAll: true },
  outDir: './dist',
  build: {
    // `preserve`: `[...slug]/index.astro` → `route/index.html`, while `ja/404.astro` → `ja/404.html`.
    format: 'preserve',
    // Pages render in parallel; nothing in the render path keeps per-page state any more.
    concurrency: 4,
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // The sitemap is a custom endpoint (src/pages/sitemap.xml.ts) that controls the URL set and order.
  integrations: [react(), mdx()],
  markdown: {
    // Shiki is applied through `@shikijs/rehype`.
    syntaxHighlight: false,
    // Astro 7 defaults to the Sätteri processor, which does not run remark/rehype plugins;
    // the unified processor is needed for rehype-shiki and remark-directive. MDX inherits it.
    processor: unified({
      // `:::note` containers become <admonition> elements.
      // Heading id rules (custom ids, no id on h1), heading markup and TOC data.
      remarkPlugins: [remarkDirective, remarkAdmonitions, remarkHeadingIds],
      rehypePlugins: [
        [rehypeShiki, shikiOptions],
        [rehypeHeadingLinks, { minLevel: 2, maxLevel: 3 }],
      ],
    }),
  },
  vite: {
    build: {
      rollupOptions: {
        // Astro's content-assets plugin tags every MDX module with a `"use astro:head-inject"` directive that
        // the bundler does not know; the warning is noise, one line per MDX file.
        onwarn(warning, warn) {
          if (
            warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
            warning.message.includes('astro:head-inject')
          )
            return;
          warn(warning);
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // The package `exports` map hides its Sass sources from Vite's resolver; point at the workspace package.
        'igniteui-theming': fileURLToPath(
          new URL('../theming', import.meta.url)
        ),
      },
    },
    plugins: [samplesAstroWrapper],
    css: {
      preprocessorOptions: {
        scss: {
          // Keep deprecation noise from igniteui-theming out of the build log.
          silenceDeprecations: ['import', 'color-functions', 'global-builtin'],
        },
      },
    },
  },
});
