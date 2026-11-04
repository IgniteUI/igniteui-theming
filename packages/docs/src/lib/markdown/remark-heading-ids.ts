// Heading ids:
// explicit ids via `{#custom-id}` (classic) or `{/* #custom-id */}` (MDX comment) syntax, otherwise a
// github-slugger slug of the heading text (html/jsx children ignored). h1 headings get no id.
// Astro's own collector keeps ids that already exist.
import type { Heading, Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import GithubSlugger from 'github-slugger';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/** mdast's Heading children type does not know MDX expression nodes; this is the loose shape we inspect. */
interface HeadingChild {
  type: string;
  value?: string;
  data?: { estree?: { body: unknown[]; comments?: { value: string }[] } };
}

function parseClassicHeadingId(heading: string): { text: string; id?: string } {
  const match = /\s*\{#(?<id>(?:.(?!\{#|\}))*.)\}$/.exec(heading);
  if (match?.groups) {
    return { text: heading.replace(match[0], ''), id: match.groups.id!.trim() };
  }
  return { text: heading };
}

function commentContentHeadingId(comment: string): string | undefined {
  const firstPart = comment.trim().split(' ')[0];
  return firstPart?.startsWith('#')
    ? firstPart.slice(1) || undefined
    : undefined;
}

function commentHeadingId(heading: Heading): string | undefined {
  const lastChild = heading.children.at(-1) as unknown as
    HeadingChild | undefined;
  if (lastChild?.type === 'mdxTextExpression') {
    const program = lastChild.data?.estree;
    if (program) {
      if (program.body.length === 0 && program.comments?.length === 1) {
        return commentContentHeadingId(program.comments[0]!.value);
      }
    } else {
      // Astro's MDX pipeline does not always attach the estree; fall back to the raw expression text.
      const match = /^\s*\/\*(?<comment>[\s\S]*?)\*\/\s*$/.exec(
        lastChild.value ?? ''
      );
      if (match?.groups?.comment)
        return commentContentHeadingId(match.groups.comment);
    }
  }
  if (lastChild?.type === 'html') {
    const match = /^<!--(?<comment>[\s\S]*)-->$/.exec(lastChild.value ?? '');
    if (match?.groups?.comment)
      return commentContentHeadingId(match.groups.comment);
  }
  return undefined;
}

function extractCommentId(heading: Heading): string | undefined {
  const id = commentHeadingId(heading);
  if (!id) return undefined;
  heading.children.pop();
  const newLast = heading.children.at(-1);
  if (newLast?.type === 'text') newLast.value = newLast.value.trimEnd();
  return id;
}

function extractClassicSyntaxHeadingId(
  heading: Heading,
  headingText: string
): string | undefined {
  const parsed = parseClassicHeadingId(headingText);
  if (!parsed.id) return undefined;
  const lastNode = heading.children.at(-1) as unknown as HeadingChild;
  if (heading.children.length > 1) {
    const lastNodeText = parseClassicHeadingId(lastNode.value ?? '').text;
    if (lastNodeText) lastNode.value = lastNodeText;
    else heading.children.pop();
  } else {
    lastNode.value = parsed.text;
  }
  return parsed.id;
}

const remarkHeadingIds: Plugin<[{ anchorsMaintainCase?: boolean }?], Root> = (
  options = {}
) => {
  const maintainCase = options.anchorsMaintainCase ?? false;
  return (tree) => {
    const slugger = new GithubSlugger();
    visit(tree, 'heading', (heading: Heading) => {
      const data = (heading.data ??= {});
      const properties = ((
        data as { hProperties?: Record<string, unknown> }
      ).hProperties ??= {});
      const headingText = () => {
        const textNodes = heading.children.filter(
          ({ type }) => !['html', 'jsx'].includes(type)
        );
        return toString(textNodes.length > 0 ? textNodes : heading);
      };
      const id =
        (typeof properties.id === 'string'
          ? slugger.slug(properties.id, true)
          : undefined) ??
        extractCommentId(heading) ??
        extractClassicSyntaxHeadingId(heading, headingText()) ??
        slugger.slug(headingText(), maintainCase);
      // h1 headings get no id (they never appear in the TOC).
      if (heading.depth === 1) {
        delete properties.id;
        return;
      }
      (data as { id?: string }).id = id;
      properties.id = id;
    });
  };
};

export default remarkHeadingIds;
