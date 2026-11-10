import { describe, expect, it } from 'vitest';
import { createExcerpt, parseContentTitle } from '../markdown';

describe('parseContentTitle', () => {
  it('reads an ATX title after imports', () => {
    expect(
      parseContentTitle(
        "import x from 'y';\n\n# Hello `world` {#custom}\n\ntext"
      )
    ).toBe('Hello world');
  });
  it('ignores leading whitespace (tab-indented title)', () => {
    expect(parseContentTitle('\n\t# How the spacing works\n\n  ## sub')).toBe(
      'How the spacing works'
    );
  });
  it('reads a setext title', () => {
    expect(parseContentTitle('Title\n=====\n\ntext')).toBe('Title');
  });
  it('returns undefined when the first content is not a title', () => {
    expect(parseContentTitle('text\n\n# later')).toBeUndefined();
  });
});

describe('createExcerpt', () => {
  it('skips imports, titles and code, and strips markdown', () => {
    const md =
      "import a from 'b';\n\n# Title\n\n```scss\n$x: 1;\n```\n\nUse the **`color()`** [function](./x) here.";
    expect(createExcerpt(md)).toBe('Use the color() function here.');
  });

  it('never leaves a complete HTML tag behind, even for nested fragments', () => {
    const excerpt = createExcerpt('A <<b>script>alert(1)<</b>/script> line');
    expect(excerpt).not.toMatch(/<[^>]*>/);
    expect(excerpt).not.toContain('<script');
  });
});
