import "../../elements/index.js";
import { html, LitElement, nothing } from "lit";
import { define } from "../../define.js";
import type { FamilyBlock } from "../../preset-model.js";
import { call, type Entry, raw, statement } from "../../sass-code.js";
import { modelFor } from "./model.js";
import { ColorStateController, type ColorStore } from "./state.js";
import { legend, type Probe, strip } from "./strip.js";

const block = (family: FamilyBlock, probe: Probe, accents = true) => html`
  <article>
    <header>
      <span class="dot" style=${`background:${family.seed}`}></span>
      <h3>${family.label}</h3>
      <code>${family.seed}</code>
    </header>
    <div class="stack">${family.shades.map((row) => strip(row, probe))}</div>
    ${accents ? html`<div class="stack">${family.accents.map((row) => strip(row, probe))}</div>` : nothing}
  </article>
`;

/**
 * The selected palette, as it ships and as the fitted generator rebuilds it from the
 * very seeds the shipped palette records. Same input on both sides, which is the only
 * way the comparison means anything.
 */
export class ViewShades extends LitElement {
  static properties = {
    store: { attribute: false },
    embedded: { type: Boolean },
    family: { state: true },
  };

  /** A store of its own; without one the view follows the page's. */
  declare store?: ColorStore;
  /** In an article: no explanatory prose and no Sass, the surrounding text carries both. */
  declare embedded: boolean;
  /**
   * Embedded only: the one family on show. Six families and their accents are two
   * screens of swatches, far more than an article needs to make its point; the reader
   * can still step through all of them.
   */
  declare family: string;

  private state = new ColorStateController(this);

  constructor() {
    super();
    this.embedded = false;
    this.family = "primary";
  }

  private get probe(): Probe {
    return {
      pinned: this.state.value.pinned,
      pin: (pinned) => this.state.set({ pinned }),
    };
  }

  createRenderRoot() {
    return this;
  }

  /** The family an embed shows: one at a time, picked by the reader. */
  private shownFamily(families: FamilyBlock[]) {
    return families.find((f) => f.key === this.family) ?? families[0];
  }

  private oneFamily(families: FamilyBlock[]) {
    const shown = this.shownFamily(families);

    return html`
      <div class="picker family-picker">
        <span class="picker-label" id="shades-family">Family</span>
        <igc-button-group
          selection="single"
          aria-labelledby="shades-family"
          @igcSelect=${({ detail }: CustomEvent<string | undefined>) => {
            if (detail) this.family = detail;
          }}
        >
          ${families.map(
            (f) => html`
              <igc-toggle-button value=${f.key} ?selected=${f === shown}>
                ${f.label}
              </igc-toggle-button>
            `,
          )}
        </igc-button-group>
      </div>
      ${block(shown, this.probe, false)}
    `;
  }

  render() {
    const model = modelFor(this.state.value);
    const args: Entry[] = [
      ...model.families.map(
        (family): Entry => [`$${family.key}`, raw(family.seed.toLowerCase())],
      ),
      ["$gray", raw(model.surface.seed.toLowerCase())],
      ["$surface", raw(model.bg.toLowerCase())],
    ];

    return html`
      ${
        this.embedded
          ? nothing
          : html`<p class="sub">
        The promise is simple: any two shades that are 500 apart, like 100 and 600, have
        enough contrast to pass the WCAG AA standard for text. The <code>fitted</code>
        generator is built to keep that promise. The <code>legacy</code> generator keeps
        it only by luck, and often not at all. Hover over any swatch to see its token,
        its measured contrast, and anything that went wrong with it.
      </p>`
      }

      ${legend(this.probe, {
        // Chromatic families are cut, and measured, against white whatever the page is.
        against: "white",
        rows: this.embedded
          ? this.shownFamily(model.families).shades
          : model.families.flatMap((f) => [...f.shades, ...f.accents]),
      })}

      ${
        this.embedded
          ? this.oneFamily(model.families)
          : model.families.map((family) => block(family, this.probe))
      }

      ${
        this.embedded
          ? nothing
          : html`<ig-code-block
              label=${`${model.label} ${model.theme} as Sass`}
              .code=${statement("palette", call("palette", args))}
            ></ig-code-block>`
      }
    `;
  }
}

define("ig-view-shades", ViewShades);

declare global {
  interface HTMLElementTagNameMap {
    "ig-view-shades": ViewShades;
  }
}
