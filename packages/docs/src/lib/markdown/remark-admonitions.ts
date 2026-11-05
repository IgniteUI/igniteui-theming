// admonitions. `:::note[Title]` … `:::` (a remark-directive container)
// becomes an `<admonition type title>` element, which `Content` maps to the Admonition component.
import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

export const ADMONITION_KEYWORDS = [
  'secondary',
  'info',
  'success',
  'danger',
  'note',
  'tip',
  'warning',
  'important',
  'caution',
];

interface DirectiveChild {
  type: string;
  data?: { directiveLabel?: boolean };
  children?: Array<{ type: string; value?: string }>;
}
interface DirectiveNode {
  type: 'containerDirective';
  name: string;
  attributes?: Record<string, string | null | undefined>;
  children: DirectiveChild[];
  data?: Record<string, unknown>;
}

const remarkAdmonitions: Plugin<[{ keywords?: string[] }?], Root> = (
  options = {}
) => {
  const keywords = options.keywords ?? ADMONITION_KEYWORDS;
  return (tree) => {
    visit(tree, 'containerDirective', (node: unknown) => {
      const directive = node as DirectiveNode;
      if (!keywords.includes(directive.name)) return;
      const hasLabel = directive.children[0]?.data?.directiveLabel === true;
      const label: DirectiveChild | undefined = hasLabel
        ? directive.children[0]
        : undefined;
      const contentNodes = hasLabel
        ? directive.children.slice(1)
        : directive.children;
      const textOnlyTitle =
        directive.attributes?.title ??
        (label &&
        label.children?.length === 1 &&
        label.children[0]!.type === 'text'
          ? label.children[0]!.value
          : undefined);
      directive.data = {
        hName: 'admonition',
        hProperties: {
          ...(textOnlyTitle && { title: textOnlyTitle }),
          ...(directive.attributes?.class && {
            className: directive.attributes.class,
          }),
          ...(directive.attributes?.id && { id: directive.attributes.id }),
          type: directive.name,
        },
      };
      directive.children = contentNodes;
      if (label && !textOnlyTitle) {
        directive.children.unshift({
          type: 'mdxAdmonitionTitle',
          data: { hName: 'mdxAdmonitionTitle', hProperties: {} } as never,
          children: label.children,
        } as never);
      }
    });
  };
};

export default remarkAdmonitions;
