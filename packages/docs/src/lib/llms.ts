// llms.txt and llms-full.txt for the current en docs.
// The index lists every doc sorted by route, as `- [title](https://…/docs/….md): description`.
// The full file appends each doc's markdown; the plugin converted rendered HTML back to markdown, here the
// MDX source is cleaned instead (imports, JSX components and tab wrappers removed), an accepted difference.
import { getDocsModel } from './docs/astro-model';
import { SITE_BASE, SITE_TITLE, SITE_URL } from './docs/config';
import type { DocMeta } from './docs/types';
import { mdxToMarkdown } from './markdown/mdx-to-markdown';

export { mdxToMarkdown };

const SITE_DESCRIPTION = 'Official Ignite UI Theming documentation';
const OPTIONAL_LINKS = [
  {
    title: 'GitHub Repository',
    url: 'https://github.com/IgniteUI/igniteui-theming',
    description: 'Source code, issues, and release notes.',
  },
];

/** Absolute URL of a doc's markdown twin, so the links resolve wherever llms.txt is read from. */
function mdUrl(doc: DocMeta): string {
  const route = doc.permalink.slice(SITE_BASE.length).replace(/\/$/, '');
  return `${SITE_URL}${SITE_BASE}${route}.md`;
}

async function currentDocs() {
  const model = await getDocsModel('en', 'current');
  return {
    model,
    docs: [...model.docs].sort((a, b) =>
      a.permalink.localeCompare(b.permalink)
    ),
  };
}

export async function buildLlmsTxt(): Promise<string> {
  const { docs } = await currentDocs();
  let content = `# ${SITE_TITLE}\n\n> ${SITE_DESCRIPTION}\n\n\n## theming-docs\n\n\n### docs\n\n`;
  for (const doc of docs) {
    content += `- [${doc.title}](${mdUrl(doc)})${doc.description ? `: ${doc.description}` : ''}\n`;
  }
  content += `\n## Optional\n`;
  for (const link of OPTIONAL_LINKS)
    content += `- [${link.title}](${link.url}): ${link.description}\n`;
  return content;
}

/** One doc as plain markdown (the `/docs/….md` endpoints and the sections of llms-full.txt). */
export async function docMarkdown(doc: DocMeta): Promise<string> {
  const model = await getDocsModel('en', 'current');
  const body = mdxToMarkdown(model.entries.get(doc.id)?.body ?? '');
  return doc.contentTitle ? body : `# ${doc.title}\n\n${body}`;
}

export async function buildLlmsFullTxt(): Promise<string> {
  const { docs } = await currentDocs();
  let content = await buildLlmsTxt();
  content += '\n\n---\n\n# Full Documentation Content\n\n';
  for (const doc of docs) content += `${await docMarkdown(doc)}\n\n---\n\n`;
  return content;
}
