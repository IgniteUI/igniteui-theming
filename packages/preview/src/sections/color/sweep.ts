import "../../elements/index.js";
import data from "virtual:data/color.sweep";
import { html, LitElement } from "lit";
import { contrast, type Rgb, readableOn } from "../../color.js";
import type { SweepRamp } from "../../data/color/sweep.js";
import { define } from "../../define.js";
import { findings, isClamped, shadeHex, shadeRgb } from "../../ramp.js";
import { SHADES } from "../../variants.js";

const WHITE: Rgb = [255, 255, 255];
/** Milliseconds per hue step while sweeping: a full circle in about sixteen seconds. */
const SWEEP_INTERVAL = 45;

/** Sweeps the seed across the whole hue circle, at more than one saturation. */
export class ViewSweep extends LitElement {
  static properties = {
    embedded: { type: Boolean },
    hue: { state: true },
    row: { state: true },
    running: { state: true },
  };

  /** In an article: the plot with a one-line key, and the argument left to the text. */
  declare embedded: boolean;
  declare hue: number;
  /** Index into `data.rows`: which saturation. */
  declare row: number;
  declare running: boolean;

  private timer = 0;

  constructor() {
    super();
    this.embedded = false;
    this.hue = 204;
    this.row = data.rows.length - 1;
    this.running = false;
  }

  createRenderRoot() {
    return this;
  }

  disconnectedCallback() {
    this.stop();
    super.disconnectedCallback();
  }

  private get index() {
    return (
      Math.round(this.hue / data.hueStep) % data.rows[this.row].seeds.length
    );
  }

  private get seed() {
    return `#${data.rows[this.row].seeds[this.index]}`;
  }

  private stop = () => {
    clearInterval(this.timer);
    this.timer = 0;
    this.running = false;
  };

  private toggle() {
    if (this.timer) {
      this.stop();
      return;
    }

    this.running = true;
    this.timer = window.setInterval(() => {
      this.hue = (this.hue + data.hueStep) % 360;
    }, SWEEP_INTERVAL);
  }

  private strip(ramp: SweepRamp, label: string) {
    return html`
      <div class="row">
        <span class="who">${label}</span>
        <div class="strip">
          ${SHADES.map((key, i) => {
            const rgb = shadeRgb(ramp, i);
            const hex = shadeHex(ramp, i);
            const cr = contrast(rgb, WHITE);
            const clamped = isClamped(ramp, i);

            return html`
              <span
                class=${`swatch ${clamped ? "is-clipped" : ""}`}
                style=${`background:${hex};color:${readableOn(rgb)}`}
                title=${`${key}  ${hex}\n${cr.toFixed(2)}:1 against white${clamped ? "\nclamped into sRGB" : ""}`}
              >
                <span class="swatch-key">${key}</span>
                <span class="swatch-ratio">${cr.toFixed(1)}:1</span>
              </span>
            `;
          })}
        </div>
        <ig-verdict .findings=${findings(ramp)}></ig-verdict>
      </div>
    `;
  }

  render() {
    const row = data.rows[this.row];
    const legacy = row.legacy[this.index];
    const fitted = row.fitted[this.index];
    const totals = data.totals;
    const count = (n: number) => n.toLocaleString("en-US");

    return html`
      <div class="sweep-head">
        <span class="seed-chip" style=${`background:${this.seed}`}></span>
        <span class="seed-readout"><span>seed</span> <b>${this.seed}</b></span>
        <span class="tag" id="sweep-saturation">Saturation</span>
        <igc-button-group
          selection="single"
          aria-labelledby="sweep-saturation"
          @igcSelect=${({ detail }: CustomEvent<string | undefined>) => {
            if (detail !== undefined) this.row = Number(detail);
          }}
        >
          ${data.rows.map(
            (entry, i) => html`
              <igc-toggle-button value=${String(i)} ?selected=${i === this.row}>
                ${entry.saturation}%
              </igc-toggle-button>
            `,
          )}
        </igc-button-group>
        <igc-button variant="outlined" class="sweep-toggle" @click=${this.toggle}>
          ${this.running ? "Stop" : "Sweep"}
        </igc-button>
      </div>

      <!--
        The one control that stays bespoke. Its track is the hue wheel itself, and
        \`igc-slider\` only exposes flat color tokens — no hook for a gradient.
      -->
      <label class="tag" for="sweep-hue">Hue &mdash; ${this.hue}&deg;</label>
      <input id="sweep-hue" class="hue-input" type="range" min="0" max="359"
        .value=${String(this.hue)} step=${data.hueStep}
        aria-label="Seed hue in degrees"
        @pointerdown=${this.stop}
        @input=${(event: Event) => {
          this.hue = Number((event.target as HTMLInputElement).value);
        }} />

      <div class="strips">${this.strip(legacy, "legacy")}${this.strip(fitted, "fitted")}</div>

      <div class="keyline">
        <span>Shades <b>50 to 900</b>, each with its contrast against white</span>
        <span><span class="key-hatch" aria-hidden="true"></span><b>clamped</b>: the generator asked for a color the screen cannot show</span>
      </div>

      ${
        this.embedded
          ? html`
            <ig-gamut-plot seed=${this.seed} .legacy=${legacy} .fitted=${fitted}></ig-gamut-plot>
            <div class="keyline">
              <span>The lit shape is every color this hue can show on screen.</span>
            </div>
          `
          : html`
      <div class="two-up is-plot">
        <ig-gamut-plot seed=${this.seed} .legacy=${legacy} .fitted=${fitted}></ig-gamut-plot>
        <div>
          <p class="note">
            This is a slice through every color your screen can show, at the current hue.
            The lit shape is the whole range for this hue. Its widest point, the cusp,
            moves a long way as you sweep: more than twofold in both how vivid and how
            light a color can get.
          </p>
          <p class="note">
            The hollow rings show where the legacy multiplier table asked a shade to be
            when that was outside what a screen can show. The dotted line leads to where
            the shade actually landed. When two shades get pushed to the same edge, two
            tokens end up the same color.
          </p>
          <p class="note">
            Across all ${count(totals.seeds)} seeds in this grid,
            <b>${count(totals.legacyClean)}</b> pass every AA pair with the legacy
            generator, against <b>${count(totals.fittedClean)}</b> with the fitted one.
            Every shade that fell outside the screen's range came from the most vivid
            row: ${count(totals.legacyOog)} of ${count(totals.shades)} shades, and none
            below ${Math.max(...data.saturations)}% saturation.
          </p>
        </div>
      </div>
          `
      }
    `;
  }
}

define("ig-view-sweep", ViewSweep);

declare global {
  interface HTMLElementTagNameMap {
    "ig-view-sweep": ViewSweep;
  }
}
