// plain-markdown view of an MDX source body (pure; unit-tested without the Astro virtual modules).
import { sassDoc } from '../../utils/sassdoc';

/** Turns an MDX source body into plain markdown: drops imports/exports, JSX components and tab wrappers. */
export function mdxToMarkdown(body: string): string {
  return (
    dedent(body)
      // import statements: single-line, or multi-line up to the line that names the module
      .replace(/^import\s[\s\S]*?['"][^'"\n]*['"];?[ \t]*(?:\n|$)/gm, '')
      // export declarations: up to the next blank line (or the end of the input)
      .replace(/^export\s[\s\S]*?(?:\n\n|(?![\s\S]))/gm, '')
      // Tabs wrappers: keep the tab label as a heading-like line, drop the tags
      .replace(/<TabItem[^>]*label="([^"]*)"[^>]*>/g, '**$1**\n')
      .replace(/<\/?Tabs?[^>]*>/g, '')
      .replace(/<\/TabItem>/g, '')
      // self-closing or paired JSX components (capitalised tags), including their props
      .replace(/<[A-Z][A-Za-z]*\b[^>]*\/>/g, '')
      .replace(/<([A-Z][A-Za-z]*)\b[^>]*>[\s\S]*?<\/\1>/g, '')
      // native JSX: `<a href={`${sassDoc}/…`}>` becomes a markdown link, images with expression sources go,
      // and attribute expressions / class names (implementation details) are dropped from the remaining tags
      .replace(
        /<a href=\{`\$\{sassDoc\}([^`]*)`\}>([\s\S]*?)<\/a>/g,
        (_m, path: string, text: string) => `[${text}](${sassDoc}${path})`
      )
      .replace(/<a href=\{['"]([^'"]+)['"]\}>([\s\S]*?)<\/a>/g, '[$2]($1)')
      .replace(/<img\b[^>]*src=\{[^}]*\}[^>]*\/?>/g, '')
      .replace(/\s[a-zA-Z]+=\{(?:`[^`]*`|\{[^}]*\}|[^{}`])*\}/g, '')
      .replace(/\s(?:className|class)="[^"]*"/g, '')
      // MDX comments, JSX expressions in code fences meta (`{:lang}`) and stray braces
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\{:[a-z]+\}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/** Removes the indentation shared by every non-empty line (several docs are written indented by two spaces). */
function dedent(text: string): string {
  const lines = text.split('\n');
  const indents = lines
    .filter((l) => l.trim())
    .map((l) => /^[ \t]*/.exec(l)![0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return min
    ? lines
        .map((l) => l.slice(Math.min(min, /^[ \t]*/.exec(l)![0].length)))
        .join('\n')
    : text;
}
