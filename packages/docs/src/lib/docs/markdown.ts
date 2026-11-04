// Markdown helpers for titles and descriptions.

/** `parseMarkdownContentTitle`: the first `# heading` (ATX or setext) before any contentful paragraph, skipping imports. */
export function parseContentTitle(
  contentUntrimmed: string
): string | undefined {
  const content = contentUntrimmed.trim();
  const contentWithoutImport = content
    .replace(/^(?:import\s(?:.|\r?\n(?!\r?\n))*(?:\r?\n){2,})*/, '')
    .trim();
  const regularTitleMatch = /^#[ \t]+(?<title>[^ \t].*)(?:\r?\n|$)/.exec(
    contentWithoutImport
  );
  const alternateTitleMatch = /^(?<title>.*)\r?\n=+(?:\r?\n|$)/.exec(
    contentWithoutImport
  );
  if (regularTitleMatch?.groups) {
    return toTextContentTitle(
      regularTitleMatch.groups
        .title!.trim()
        .replace(/\s*(?:\{#*[\w-]+\}|#+)$/, '')
    ).trim();
  }
  if (alternateTitleMatch?.groups) {
    return toTextContentTitle(
      alternateTitleMatch.groups.title!.trim().replace(/\s*=+$/, '')
    ).trim();
  }
  return undefined;
}

function toTextContentTitle(contentTitle: string): string {
  return contentTitle.replace(/`(?<text>[^`]*)`/g, '$<text>');
}

/** Strips HTML tags, repeating until nothing changes so that nested fragments like `<scr<b>ipt>` cannot survive one pass. */
function stripHtmlTags(text: string): string {
  let previous: string;
  let current = text;
  do {
    previous = current;
    current = current.replace(/<[^>]*>/g, '');
  } while (current !== previous);
  return current;
}

/** `createExcerpt`: the first contentful line, stripped of markdown, used as the default description. */
export function createExcerpt(fileString: string): string | undefined {
  const fileLines = fileString
    .trimStart()
    // Remove Markdown alternate title
    .replace(/^[^\r\n]*\r?\n[=]+/g, '')
    .split(/\r?\n/);
  let inCode = false;
  let inImport = false;
  let lastCodeFence = '';
  for (const fileLine of fileLines) {
    // An empty line marks the end of imports
    if (!fileLine.trim() && inImport) {
      inImport = false;
    }
    // Skip empty line.
    if (!fileLine.trim()) {
      continue;
    }
    // Skip import/export declaration.
    if ((/^(?:import|export)\s.*/.test(fileLine) || inImport) && !inCode) {
      inImport = true;
      continue;
    }
    // Skip code block line.
    if (fileLine.trim().startsWith('```')) {
      const codeFence = fileLine.trim().match(/^`+/)![0];
      if (!inCode) {
        inCode = true;
        lastCodeFence = codeFence;
        // If we are in a ````-fenced block, all ``` would be plain text instead of fences
      } else if (codeFence.length >= lastCodeFence.length) {
        inCode = false;
      }
      continue;
    } else if (inCode) {
      continue;
    }
    const cleanedLine = stripHtmlTags(fileLine)
      // Remove Title headers
      .replace(/^#[^#]+#?/gm, '')
      // Remove Markdown + ATX-style headers
      .replace(/^#{1,6}\s*(?<text>[^#]*?)\s*#{0,6}/gm, '$1')
      // Remove emphasis.
      .replace(/(?<opening>[*_]{1,3})(?<text>.*?)\1/g, '$2')
      // Remove strikethroughs.
      .replace(/~~(?<text>\S.*\S)~~/g, '$1')
      // Remove images.
      .replace(/!\[(?<alt>.*?)\][[(].*?[\])]/g, '$1')
      // Remove footnotes.
      .replace(/\[\^.+?\](?:: .*$)?/g, '')
      // Remove inline links.
      .replace(/\[(?<alt>.*?)\][[(].*?[\])]/g, '$1')
      // Remove inline code.
      .replace(/`(?<text>.+?)`/g, '$1')
      // Remove blockquotes.
      .replace(/^\s{0,3}>\s?/g, '')
      // Remove admonition definition.
      .replace(/:::.*/, '')
      // Remove Emoji names within colons include preceding whitespace.
      .replace(/\s?:(?:::|[^:\n])+:/g, '')
      // Remove custom Markdown heading id.
      .replace(/\{#*[\w-]+\}/, '')
      .trim();
    if (cleanedLine) {
      return cleanedLine;
    }
  }
  return undefined;
}
