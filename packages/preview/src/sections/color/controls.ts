import "../../elements/index.js";
import { html, LitElement } from "lit";
import { define } from "../../define.js";
import { isPresetKey, isTheme, PRESETS, THEMES } from "../../variants.js";
import { ColorStateController, setColorState } from "./state.js";

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
            if (isPresetKey(detail)) setColorState({ preset: detail });
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

      <div class="picker">
        <span class="picker-label" id="picker-theme">Theme</span>
        <igc-button-group
          selection="single"
          aria-labelledby="picker-theme"
          @igcSelect=${({ detail }: Select) => {
            if (isTheme(detail)) setColorState({ theme: detail });
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
    `;
  }
}

define("ig-color-controls", ColorControls);

declare global {
  interface HTMLElementTagNameMap {
    "ig-color-controls": ColorControls;
  }
}
