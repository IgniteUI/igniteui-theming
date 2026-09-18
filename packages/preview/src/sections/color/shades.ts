import "../../elements/index.js";
import { html, LitElement } from "lit";
import { define } from "../../define.js";
import type { FamilyBlock } from "../../preset-model.js";
import { call, type Entry, raw, statement } from "../../sass-code.js";
import { modelFor } from "./model.js";
import { ColorStateController, setColorState } from "./state.js";
import { legend, type Probe, strip } from "./strip.js";

const block = (family: FamilyBlock, probe: Probe) => html`
  <article>
    <header>
      <span class="dot" style=${`background:${family.seed}`}></span>
      <h3>${family.label}</h3>
      <code>${family.seed}</code>
    </header>
    <div class="stack">${family.shades.map((row) => strip(row, probe))}</div>
    <div class="stack">${family.accents.map((row) => strip(row, probe))}</div>
  </article>
`;

/**
 * The selected palette, as it ships and as the fitted generator rebuilds it from the
 * very seeds the shipped palette records. Same input on both sides, which is the only
 * way the comparison means anything.
 */
export class ViewShades extends LitElement {
  private state = new ColorStateController(this);

  private get probe(): Probe {
    return {
      pinned: this.state.value.pinned,
      pin: (pinned) => setColorState({ pinned }),
    };
  }

  createRenderRoot() {
    return this;
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
      <p class="sub">
        The promise is simple: any two shades that are 500 apart, like 100 and 600, have
        enough contrast to pass the WCAG AA standard for text. The <code>fitted</code>
        generator is built to keep that promise. The <code>legacy</code> generator keeps
        it only by luck, and often not at all. Hover over any swatch to see its token,
        its measured contrast, and anything that went wrong with it.
      </p>

      ${legend(this.probe)}

      ${model.families.map((family) => block(family, this.probe))}

      <ig-code-block
        label=${`${model.label} ${model.theme} as Sass`}
        .code=${statement("palette", call("palette", args))}
      ></ig-code-block>
    `;
  }
}

define("ig-view-shades", ViewShades);

declare global {
  interface HTMLElementTagNameMap {
    "ig-view-shades": ViewShades;
  }
}
