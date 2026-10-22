import "../../elements/index.js";
import data from "virtual:data/color.seeds";
import { html, LitElement } from "lit";
import { define } from "../../define.js";
import { familyRow } from "../../preset-model.js";
import { ColorStateController, type ColorStore } from "./state.js";
import { legend, type Probe, strip } from "./strip.js";

/** Rows are built once: the data is fixed at build time. */
const rows = data.seeds.map((seed) => ({
  seed,
  legacy: familyRow(seed.legacy, "legacy", "primary"),
  fitted: familyRow(seed.fitted, "fitted", "primary"),
}));

const ROWS = rows.flatMap(({ legacy, fitted }) => [legacy, fitted]);

/**
 * One dark seed and one pale seed, all ten shades from each generator. The legacy rows
 * are where the problem is visible at a glance: a family that never gets light, and a
 * family whose first four shades are the same white.
 */
export class ViewSeeds extends LitElement {
  static properties = {
    store: { attribute: false },
    embedded: { type: Boolean },
  };

  /** A store of its own; without one the view follows the page's. */
  declare store?: ColorStore;
  /** Accepted for symmetry with the other views; this one has no prose to drop. */
  declare embedded: boolean;

  private state = new ColorStateController(this);

  constructor() {
    super();
    this.embedded = false;
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

  render() {
    return html`
      ${legend(this.probe, { against: "white", rows: ROWS })}
      ${rows.map(
        ({ seed, legacy, fitted }) => html`
          <article>
            <header>
              <span class="dot" style=${`background:${seed.hex}`}></span>
              <h3>${seed.label}</h3>
              <code>${seed.css}</code>
            </header>
            <div class="stack">
              ${strip(legacy, this.probe)} ${strip(fitted, this.probe)}
            </div>
          </article>
        `,
      )}
    `;
  }
}

define("ig-view-seeds", ViewSeeds);

declare global {
  interface HTMLElementTagNameMap {
    "ig-view-seeds": ViewSeeds;
  }
}
