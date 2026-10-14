/**
 * The demo stylesheet, split in two.
 *
 * Everything but the `@property` rules is adopted by each demo's shadow root. Those rules
 * register typed custom properties with initial values the shipped components rely on —
 * `--ig-spacing` among them — and a registration is only honoured from a document
 * stylesheet, so they are lifted out and added to the host page once. They are namespaced
 * `--ig-*` and inherit, so a page that already uses Ignite UI registers the same ones.
 *
 * The library's mixins put their tokens on `:root`, which matches nothing inside a shadow
 * root; in this sheet every `:root` means the demo's host.
 */
// biome-ignore lint/correctness/useImportExtensions: a Vite query, not a module path.
import css from "./embed.scss?inline";

const PROPERTY = /@property\s+[^{]+\{[^}]*\}/g;

export const demoSheet = new CSSStyleSheet();
demoSheet.replaceSync(css.replace(PROPERTY, "").replace(/:root\b/g, ":host"));

const REGISTRATIONS_ID = "ig-demo-properties";

export const registerProperties = () => {
  if (document.getElementById(REGISTRATIONS_ID)) return;

  const style = document.createElement("style");
  style.id = REGISTRATIONS_ID;
  style.textContent = (css.match(PROPERTY) ?? []).join("\n");
  document.head.append(style);
};
