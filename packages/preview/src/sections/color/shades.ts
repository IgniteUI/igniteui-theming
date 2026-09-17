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
        The guarantee: any two shades 500 apart clear WCAG AA. It holds by construction
        under <code>fitted</code>, and by accident &mdash; or not at all &mdash; under
        <code>legacy</code>. Hover any swatch for its token, its measured ratio and
        whatever is wrong with it.
      </p>

      ${legend(this.probe)}

      ${model.families.map((family) => block(family, this.probe))}

      <ig-code-block
        label=${`${model.label} ${model.theme}, as you would write it`}
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
