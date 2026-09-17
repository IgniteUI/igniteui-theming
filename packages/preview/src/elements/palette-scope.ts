/**
 * Applies one compiled palette to its own subtree.
 *
 * A demo that relied on a stylesheet somebody else added to the document would only work
 * inside this application. Setting the declarations on the element itself means the
 * palette travels with the markup, and custom properties inherit through shadow
 * boundaries, so children resolve `var(--ig-*)` wherever they are.
 *
 * It deliberately does not render: children belong to whoever wrote the template.
 */
import { define } from "../define.js";
export class PaletteScope extends HTMLElement {
  #vars: Record<string, string> = {};

  set vars(next: Record<string, string> | undefined) {
    for (const name of Object.keys(this.#vars)) {
      if (!next || !(name in next)) this.style.removeProperty(name);
    }

    this.#vars = next ?? {};

    for (const [name, value] of Object.entries(this.#vars)) {
      this.style.setProperty(name, value);
    }
  }

  get vars() {
    return this.#vars;
  }
}

define("ig-palette-scope", PaletteScope);

declare global {
  interface HTMLElementTagNameMap {
    "ig-palette-scope": PaletteScope;
  }
}
