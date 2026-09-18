/**
 * Syntax highlighting for the Sass snippets, through Shiki's fine-grained core: one
 * grammar, one theme, and the JavaScript regex engine rather than the WebAssembly one,
 * so the whole thing is a few tens of kilobytes rather than a megabyte.
 *
 * The one theme is dark in both chrome schemes. A code block is a panel of its own, and
 * a dark panel on a light page reads as "code" the way a terminal does.
 */
import scss from "@shikijs/langs/scss";
import theme from "@shikijs/themes/github-dark-default";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const THEME_NAME = "github-dark-default";

let pending: Promise<HighlighterCore> | undefined;

/** Built once, on first use, and shared by every code block on the page. */
const highlighter = () => {
  pending ??= createHighlighterCore({
    langs: [scss],
    themes: [theme],
    engine: createJavaScriptRegexEngine(),
  });

  return pending;
};

/** Sass source as a highlighted `<pre>`, painted in the theme's own colors. */
export const highlightSass = async (code: string) =>
  (await highlighter()).codeToHtml(code, { lang: "scss", theme: THEME_NAME });
