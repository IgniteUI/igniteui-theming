import "../../elements/index.js";
import { html, LitElement } from "lit";
import { define } from "../../define.js";
import type { Role, SurfaceBlock } from "../../preset-model.js";
import { modelFor } from "./model.js";
import { ColorStateController, setColorState } from "./state.js";
import { legend, type Probe, strip } from "./strip.js";

/** A page built from nothing but the five surface roles, text included. */
const mock = (surface: SurfaceBlock) => html`
  <ig-palette-scope class="mock" .vars=${surface.fittedVars}>
    <div class="mock-bar"><span class="mock-title"></span><span class="mock-pill"></span></div>
    <div class="mock-well"><span>sunken &mdash; a well</span></div>
    <div class="mock-card">
      <strong>raised</strong><span>a card that sits on the page</span>
      <div class="mock-line"></div>
      <div class="mock-line is-short"></div>
    </div>
    <div class="mock-pop">
      <strong>overlay</strong><span>a menu above everything</span>
    </div>
  </ig-palette-scope>
`;

const role = (surface: SurfaceBlock, r: Role) => html`
  <div class="role">
    <span class="role-swatch" style=${`background:${surface.bg}`}>
      <span style=${`background:var(--ig-surface-${r.key})`}></span>
    </span>
    <div>
      <code>${r.key}</code>
      <span class="role-distance">
        ${r.collapsed ? "on the background" : `${r.away.toFixed(2)}:1 away`}
      </span>
    </div>
  </div>
`;

/**
 * Surface stopped being ten numbered shades, and gray stopped being anchored to white.
 * Both are about the page rather than about a color, which is why they share a view.
 */
export class ViewNeutrals extends LitElement {
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
    const surface = model.surface;

    return html`
      <article>
        <header>
          <span class="dot" style=${`background:${surface.bg}`}></span>
          <h3>${model.label} ${model.theme}</h3>
          <code>${surface.bg}</code>
        </header>
        <div class="two-up">
          ${mock(surface)}
          <div>
            <div class="stack">${strip(surface.legacySurface, this.probe)}</div>
            <p class="note">
              Ten numbered shades, no role names. On a page at either extreme most of
              them collapse onto the background &mdash; the generator has nowhere left to
              go.
            </p>
            <ig-palette-scope class="roles" .vars=${surface.fittedVars}>
              ${surface.roles.map((r) => role(surface, r))}
            </ig-palette-scope>
            <p class="note">
              Five roles that say what they are for. A role with no room resolves onto
              the background on purpose, and the shadow carries the elevation instead.
              The mock on the left is built entirely from them, text included.
            </p>
          </div>
        </div>
      </article>

      ${legend(this.probe)}

      <h3 class="group">Grayscale</h3>
      <p class="sub">
        Anchored to the background rather than to white, so shade 50 always sits nearest
        the page &mdash; in either theme. Seeded with <code>${surface.seed}</code>.
      </p>
      <article>
        <div class="stack">${surface.grays.map((row) => strip(row, this.probe))}</div>
        <p class="note">
          Both sides fail the same two pairs on purpose: the gray family defaults to the
          <code>material</code> scale, which keeps the rhythm our grayscale has always
          had and trades two AA pairs for it. Range and curve, below, is where that
          trade is made &mdash; and undone.
        </p>
      </article>
    `;
  }
}

define("ig-view-neutrals", ViewNeutrals);

declare global {
  interface HTMLElementTagNameMap {
    "ig-view-neutrals": ViewNeutrals;
  }
}
