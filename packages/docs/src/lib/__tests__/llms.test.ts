import { describe, expect, it } from 'vitest';
import { mdxToMarkdown } from '../markdown/mdx-to-markdown';

describe('mdxToMarkdown', () => {
  it('drops imports, JSX components and tab wrappers but keeps the markdown', () => {
    const src = `import { sassDoc } from '@/utils/sassdoc';
import CodeBlockHeader from '@/components/CodeBlockHeader';

# Title

<CoreConceptHeader label="x" title="Colors" description="d" image="i.svg" />

Intro paragraph with \`code{:scss}\`.

<Tabs className="it-install-tabs">
<TabItem value="react" label="React/Next.js" default>
1. First step

\`\`\`bash
npm i
\`\`\`
</TabItem>
</Tabs>

:::note
Keep me.
:::
`;
    const out = mdxToMarkdown(src);
    expect(out).not.toMatch(/import /);
    expect(out).not.toMatch(/<CoreConceptHeader|<Tabs|<TabItem/);
    expect(out).toContain('# Title');
    expect(out).toContain('**React/Next.js**');
    expect(out).toContain('```bash\nnpm i\n```');
    expect(out).toContain(':::note\nKeep me.\n:::');
    expect(out).toContain('`code`');
  });

  it('drops multi-line imports and exports without eating the content after them', () => {
    const src = `import {
  a,
  b,
} from '@/x';
import c from "./c";
# Title

export const Swatch = ({ hex }) => (
  <span>{hex}</span>
);

Text.`;
    const out = mdxToMarkdown(src);
    expect(out).not.toMatch(/import |export |from '|\} from/);
    expect(out.startsWith('# Title')).toBe(true);
    expect(out).toContain('Text.');
    expect(out).not.toContain('Swatch');
  });

  it('turns native JSX into markdown or plain HTML without expressions', () => {
    const src = `- <a href={\`\${sassDoc}/palettes/#function-color\`}>color() function</a>

<img src={multipliers.src} height="450px" alt="Multipliers"/>

<table className={\`\${styles.table} \${styles.wide}\`}>
<thead className={styles.head}><tr><th style={{ width: '1px' }}>A</th></tr></thead>
</table>

<div class="wrapper">kept</div>

{/* ![hidden](./x.png) */}`;
    const out = mdxToMarkdown(src);
    expect(out).toContain(
      '- [color() function](https://www.infragistics.com/products/ignite-ui-angular/docs/sass/latest/palettes/#function-color)'
    );
    expect(out).not.toMatch(/<img|=\{|className|class=/);
    expect(out).toContain('<table>');
    expect(out).toContain('<th>A</th>');
    expect(out).toContain('<div>kept</div>');
    expect(out).not.toContain('hidden');
    expect(
      mdxToMarkdown("<a href={'https://example.com/x#L9'}>$ITypeScale</a>")
    ).toBe('[$ITypeScale](https://example.com/x#L9)');
  });
});
