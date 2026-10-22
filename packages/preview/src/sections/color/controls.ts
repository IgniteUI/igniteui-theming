import "../../elements/index.js";
import { html, LitElement, nothing } from "lit";
import { define } from "../../define.js";
import { isPresetKey, isTheme, PRESETS, THEMES } from "../../variants.js";
import { ColorStateController, type ColorStore } from "./state.js";

/** `igcSelect` carries the chosen button's value; an empty group emits undefined. */
type Select = CustomEvent<string | undefined>;

/**
 * The section's one input. Every view below reads what this writes, so a reader changes a
 * palette once and watches the shades, the surface roles and the scale editor all move
 * together.
 *
 * Built from the library's own button groups: this app demonstrates a theming framework,
 * so its controls should be the components that framework themes.
 */
export class ColorControls extends LitElement {
  static properties = {
    store: { attribute: false },
    themes: { type: Boolean },
  };

  /** A store of its own; without one the controls drive the page's. */
  declare store?: ColorStore;
  /**
   * Whether to offer light and dark. Only the grays and the surface depend on the page;
   * a chromatic family is anchored to white and identical in both, so a demo of those
   * has no use for the switch.
   */
  declare themes: boolean;

  constructor() {
    super();
    this.themes = true;
  }

  private state = new ColorStateController(this);

  createRenderRoot() {
    return this;
  }

  render() {
    const { preset, theme } = this.state.value;

    return html`
      <div class="picker">
        <span class="picker-label" id="picker-palette">Palette</span>
        <igc-button-group
          selection="single"
          aria-labelledby="picker-palette"
          @igcSelect=${({ detail }: Select) => {
            if (isPresetKey(detail)) this.state.set({ preset: detail });
          }}
        >
          ${PRESETS.map(
            (entry) => html`
              <igc-toggle-button value=${entry.key} ?selected=${entry.key === preset}>
                ${entry.label}
              </igc-toggle-button>
            `,
          )}
        </igc-button-group>
      </div>

      ${
        this.themes
          ? html`
      <div class="picker">
        <span class="picker-label" id="picker-theme">Theme</span>
        <igc-button-group
          selection="single"
          aria-labelledby="picker-theme"
          @igcSelect=${({ detail }: Select) => {
            if (isTheme(detail)) this.state.set({ theme: detail });
          }}
        >
          ${THEMES.map(
            (entry) => html`
              <igc-toggle-button value=${entry} ?selected=${entry === theme}>
                ${entry === "light" ? "Light" : "Dark"}
              </igc-toggle-button>
            `,
          )}
        </igc-button-group>
      </div>
          `
          : nothing
      }
    `;
  }
}

define("ig-color-controls", ColorControls);

declare global {
  interface HTMLElementTagNameMap {
    "ig-color-controls": ColorControls;
  }
}
