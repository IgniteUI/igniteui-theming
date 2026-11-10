import type { SandpackTheme } from '@codesandbox/sandpack-react';

export const sandpackRosepineMoonTheme: SandpackTheme = {
  colors: {
    surface1: 'var(--shiki-code-bg)',
    surface2: '#2a273f',
    surface3: '#393552',
    clickable: '#c4a7e7',
    base: '#e0def4',
    disabled: '#6e6a86',
    hover: '#3e8fb0',
    accent: '#eb6f92',
  },
  syntax: {
    plain: '#e0def4',
    comment: { color: '#6e6a86', fontStyle: 'italic' },
    keyword: '#c4a7e7',
    tag: '#eb6f92',
    punctuation: '#908caa',
    definition: '#3e8fb0',
    property: '#eb6f92',
    static: '#f6c177',
    string: '#f6c177',
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'var(--it-font-family-monospace)',
    size: 'var(--it-font-size-monospace)',
    lineHeight: 'var(--it-line-height-monospace)',
  },
};

export const sandpackRosepineDawnTheme: SandpackTheme = {
  colors: {
    surface1: 'var(--shiki-code-bg)',
    surface2: '#f0f0f5',
    surface3: '#dfdad9',
    clickable: '#907aa9',
    base: '#575279',
    disabled: '#9893a5',
    hover: '#286983',
    accent: '#b4637a',
  },
  syntax: {
    plain: '#575279',
    comment: { color: '#9893a5', fontStyle: 'italic' },
    keyword: '#907aa9',
    tag: '#b4637a',
    punctuation: '#b7a4c7',
    definition: '#286983',
    property: '#b4637a',
    static: '#ea9d34',
    string: '#ea9d34',
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'var(--it-font-family-monospace)',
    size: 'var(--it-font-size-monospace)',
    lineHeight: 'var(--it-line-height-monospace)',
  },
};
