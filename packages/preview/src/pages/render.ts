/**
 * The embed test pages, rendered from `pages/`: an index, every article in
 * `pages/articles/*.md`, and a page with every demo in the catalog. Node-side only.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import css from "@shikijs/langs/css";
import scss from "@shikijs/langs/scss";
import theme from "@shikijs/themes/github-dark-default";
import { Marked } from "marked";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { CATALOG, DEMO_NAMES } from "../embed/catalog.js";

export const PAGES_DIR = fileURLToPath(
  new URL("../../pages/", import.meta.url),
);

/** Where the embed entry is, relative to the page asking. */
export type ScriptFor = (page: string) => string;

const THEME = "github-dark-default";

/** The label above a code block, in the demos' voice. */
const LABELS: Record<string, string> = { css: "CSS", scss: "Sass" };

let highlighter: Promise<HighlighterCore> | undefined;

/** The same grammar setup and theme as the demos' Sass output (src/elements/highlight.ts). */
const shiki = () => {
  highlighter ??= createHighlighterCore({
    langs: [css, scss],
    themes: [theme],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
};

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const template = (name: string) => readFileSync(`${PAGES_DIR}${name}`, "utf8");

const fill = (html: string, values: Record<string, string>) =>
  html.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "");

/** Slugs of the articles, from `pages/articles/<slug>.md`. */
export const articles = () =>
  readdirSync(`${PAGES_DIR}articles`)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.slice(0, -3))
    .sort();

const titleOf = (markdown: string, fallback: string) =>
  markdown.match(/^#\s+(.+)$/m)?.[1].trim() ?? fallback;

/**
 * One article. Demos are written `<ig-view-*>` or `<ig-demo-*>`; both become the embed
 * element. An italic paragraph straight after a demo is its caption.
 */
export const renderArticle = async (slug: string, script: string) => {
  const markdown = readFileSync(
    `${PAGES_DIR}articles/${slug}.md`,
    "utf8",
  ).replace(/<(\/?)ig-view-/g, "<$1ig-demo-");
  const highlight = await shiki();
  const marked = new Marked({
    gfm: true,
    renderer: {
      code({ text, lang }) {
        const label = lang ? LABELS[lang] : undefined;
        const html = label
          ? highlight.codeToHtml(text, { lang: lang as string, theme: THEME })
          : `<pre><code>${escapeHtml(text)}</code></pre>`;

        return `<figure class="code">${label ? `<figcaption>${label}</figcaption>` : ""}${html}</figure>\n`;
      },
    },
  });

  const body = (await marked.parse(markdown))
    // Markdown does not know a custom element is a block, so it wraps each in a paragraph.
    // The class lets the page style a demo without listing every tag.
    .replace(
      /<p>(<ig-demo-[a-z]+)(><\/ig-demo-[a-z]+>)<\/p>/g,
      '$1 class="demo"$2',
    )
    .replace(
      /(<\/ig-demo-[a-z]+>)\s*<p><em>([\s\S]*?)<\/em><\/p>/g,
      '$1\n<p class="caption">$2</p>',
    )
    .replace(/<a href="http/g, '<a rel="noopener" target="_blank" href="http');

  return fill(template("_article.html"), {
    title: escapeHtml(titleOf(markdown, slug)),
    body,
    script,
  });
};

/** Every demo in the catalog, one after another, under a hostile stylesheet. */
export const renderDemos = (script: string) =>
  fill(template("_demos.html"), {
    script,
    demos: DEMO_NAMES.map(
      (name) =>
        `<h2>${escapeHtml(CATALOG[name].title)} <code>&lt;ig-demo-${name}&gt;</code></h2>\n` +
        `<ig-demo-${name}></ig-demo-${name}>`,
    ).join("\n"),
  });

export const renderIndex = () =>
  fill(template("_index.html"), {
    articles: articles()
      .map((slug) => {
        const markdown = readFileSync(
          `${PAGES_DIR}articles/${slug}.md`,
          "utf8",
        );
        return `<li><a href="articles/${slug}.html">${escapeHtml(titleOf(markdown, slug))}</a></li>`;
      })
      .join("\n"),
  });

/**
 * Every page, keyed by its path under `pages/`, rendered with the script path the given
 * function returns for it.
 */
export const renderAll = async (scriptFor: ScriptFor) => {
  const pages = new Map<string, string>();

  pages.set("index.html", renderIndex());
  pages.set("demos.html", renderDemos(scriptFor("demos.html")));

  for (const slug of articles()) {
    const path = `articles/${slug}.html`;
    pages.set(path, await renderArticle(slug, scriptFor(path)));
  }

  return pages;
};
