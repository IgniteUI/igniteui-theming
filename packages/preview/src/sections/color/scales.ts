import "../../elements/index.js";
import data from "virtual:data/color.scales";
import { html, LitElement } from "lit";
import {
  AA,
  contrast,
  PAIR_DISTANCE,
  readableOn,
  shadePairs,
  toRgb,
} from "../../color.js";
import type { ScaleSubject } from "../../data/color/scales.js";
import { define } from "../../define.js";
import type { CurvePoint } from "../../elements/curve-editor.js";
import {
  call,
  entries,
  list,
  map,
  num,
  raw,
  statement,
} from "../../sass-code.js";
import {
  type Curve,
  ease,
  lookup,
  position,
  rampFromTable,
  SCALE_PRESETS,
  type Scale,
  type ScalePreset,
  sameScale,
  target,
} from "../../scale-math.js";
import { SHADES } from "../../variants.js";
import { ColorStateController } from "./state.js";

/** The two ends of the range cannot cross; this keeps them apart on the sliders. */
const MIN_RANGE = 0.5;
/** Past the subject's ceiling by more than this, the dark end is visibly compressing. */
const CEILING_SLACK = 0.05;

interface Step {
  key: string;
  x: number;
  t: number;
  target: number;
  hex: string;
  reached: number;
}

/** Range and curve, made editable. */
export class ViewScales extends LitElement {
  static properties = {
    subject: { state: true },
    lo: { state: true },
    hi: { state: true },
    curve: { state: true },
  };

  declare subject: string;
  declare lo: number;
  declare hi: number;
  declare curve: Curve | null;

  private state = new ColorStateController(this);

  constructor() {
    super();
    this.subject = "";
    this.apply(SCALE_PRESETS[0]);
  }

  createRenderRoot() {
    return this;
  }

  /**
   * The first render happens before `igc-slider` has upgraded, so Lit's `value` property
   * lands while the element still holds default bounds and gets quantised against them.
   * One re-render after the definition resolves is enough; `updated()` then asserts the
   * real value.
   */
  async firstUpdated() {
    await customElements.whenDefined("igc-slider");
    this.requestUpdate();
  }

  /**
   * Keeps each slider's thumb on the number its label reports. Both steps are 0.01, the
   * precision the labels print at, so the two can always agree exactly.
   */
  updated() {
    const sliders = [
      ["scale-lo", this.lo],
      ["scale-hi", this.hi],
    ] as const;

    for (const [id, value] of sliders) {
      const slider = this.querySelector<HTMLElement & { value: number }>(
        `#${id}`,
      );
      if (slider && slider.value !== value) slider.value = value;
    }
  }

  /**
   * Only the subjects the selected palette actually has. The section's control bar owns
   * the seed, so this view shows what that seed produces rather than a menu of seeds of
   * its own.
   */
  private get available(): ScaleSubject[] {
    const { preset, theme } = this.state.value;
    const tag = `${preset}-${theme}`;
    const matching = data.subjects.filter((s) => s.presets.includes(tag));

    return matching.length ? matching : data.subjects;
  }

  /** Falls back rather than resetting, so switching palette keeps the reader's place. */
  private get current(): ScaleSubject {
    const available = this.available;
    return available.find((s) => s.key === this.subject) ?? available[0];
  }

  private get scale(): Scale {
    return { range: [this.lo, this.hi], curve: this.curve };
  }

  private get ramp(): Step[] {
    const subject = this.current;
    const anchor = toRgb(subject.anchor);

    return SHADES.map((key, i) => {
      const x = position(i);
      const t = ease(x, this.curve);
      const wanted = target(this.scale.range, t);
      const hex = `#${lookup(subject.table, i, wanted)}`;

      return {
        key,
        x,
        t,
        target: wanted,
        hex,
        reached: contrast(toRgb(hex), anchor),
      };
    });
  }

  private apply({ range, curve }: Scale) {
    this.lo = range[0];
    this.hi = range[1];
    this.curve = curve ? ([...curve] as Curve) : null;
  }

  private get code() {
    const { family, seed, surface } = this.current;
    const neutral = family === "gray";

    return statement(
      "palette",
      call(
        "palette",
        entries({
          $primary: raw(neutral ? "#0099ff" : seed),
          $secondary: raw("#df1b74"),
          $surface: raw(neutral ? surface : "#fff"),
          $gray: neutral ? raw(seed) : undefined,
          $scales: map([
            [
              `'${family}'`,
              map([
                ["range", list(num(this.lo), num(this.hi))],
                [
                  "curve",
                  this.curve ? list(...this.curve.map(num)) : raw("null"),
                ],
              ]),
            ],
          ]),
        }),
      ),
    );
  }

  private preset(preset: ScalePreset) {
    const hexes = rampFromTable(this.current.table, preset);
    const failing = shadePairs(hexes.map((h) => toRgb(`#${h}`))).filter(
      (pair) => pair.contrast < AA,
    ).length;
    const pairs = SHADES.length - PAIR_DISTANCE;

    return html`
      <button type="button" class="scale-preset" aria-current=${String(sameScale(preset, this.scale))}
        @click=${() => this.apply(preset)}>
        <span class="preset-name">${preset.name}<span class="preset-why">${preset.why}</span></span>
        <span class="preset-mini">
          ${hexes.map((h) => html`<span style=${`background:#${h}`}></span>`)}
        </span>
        <span class=${`preset-record ${failing ? "is-failing" : "is-passing"}`}>
          ${pairs - failing} of ${pairs} pairs
        </span>
      </button>
    `;
  }

  private subjects(subject: ScaleSubject) {
    return html`
      <div class="subjects">
        <span class="tag" id="scale-subject">Subject</span>
        <igc-button-group
          selection="single"
          aria-labelledby="scale-subject"
          @igcSelect=${({ detail }: CustomEvent<string | undefined>) => {
            if (detail) this.subject = detail;
          }}
        >
          ${this.available.map(
            (entry) => html`
              <igc-toggle-button value=${entry.key} ?selected=${entry === subject}>
                ${entry.label}
              </igc-toggle-button>
            `,
          )}
        </igc-button-group>
      </div>
      <p class="note subject-note">
        ${subject.note} Highest contrast this subject can reach against
        <code>${subject.anchor}</code> is <b>${subject.ceiling.toFixed(2)}:1</b>.
      </p>
    `;
  }

  private controls(subject: ScaleSubject) {
    const overshoot = this.hi > subject.ceiling + CEILING_SLACK;
    const curveLabel = this.curve
      ? this.curve.map((v) => v.toFixed(2)).join(", ")
      : "linear";

    return html`
      <div class="controls">
        <div class="control">
          <label class="control-label" for="scale-lo">Lightest shade <b>${this.lo.toFixed(2)}:1</b></label>
          <igc-slider
            id="scale-lo"
            aria-label="Lightest shade contrast"
            .min=${1}
            .max=${4}
            .step=${0.01}
            .value=${this.lo}
            @igcInput=${({ detail }: CustomEvent<number>) => {
              this.lo = Math.min(detail, this.hi - MIN_RANGE);
            }}
          ></igc-slider>
          <p class="control-hint">Contrast of shade 50 against the anchor. At 1:1 it is the anchor.</p>
        </div>
        <div class="control">
          <label class="control-label" for="scale-hi">Darkest shade <b>${this.hi.toFixed(2)}:1</b></label>
          <igc-slider
            id="scale-hi"
            aria-label="Darkest shade contrast"
            .min=${6}
            .max=${21}
            .step=${0.01}
            .value=${this.hi}
            @igcInput=${({ detail }: CustomEvent<number>) => {
              this.hi = Math.max(detail, this.lo + MIN_RANGE);
            }}
          ></igc-slider>
          <p class=${`control-hint ${overshoot ? "is-over" : ""}`}>
            ${
              overshoot
                ? html`Past this subject&rsquo;s ceiling of ${subject.ceiling.toFixed(2)}:1 &mdash;
                  the dark end compresses and pairs start to fail.`
                : "Contrast of shade 900. Black on white is 21:1."
            }
          </p>
        </div>
        <div class="control">
          <span class="control-label">Curve <b>${curveLabel}</b></span>
          <p class="control-hint">Drag the two handles on the chart, or nudge them with the arrow keys.</p>
          <igc-button variant="outlined" class="control-action" @click=${() => {
            this.curve = null;
          }}>Straight line</igc-button>
        </div>
      </div>
    `;
  }

  /** Every guaranteed pair as a bar spanning the two shades, on a twenty-column grid. */
  private ladder(ramp: Step[]) {
    return html`
      <div class="ladder">
        ${shadePairs(ramp.map((s) => toRgb(s.hex))).map((pair) => {
          const ok = pair.contrast >= AA;
          // Labels sit after the bar until the bar reaches the right edge, then before it.
          const tail = pair.j >= SHADES.length - 3;
          const bar = `${pair.i * 2 + 2} / ${pair.j * 2 + 2}`;
          const label = tail
            ? `1 / ${pair.i * 2 + 2}`
            : `${pair.j * 2 + 2} / -1`;

          return html`
            <div class="ladder-row">
              <span class=${`ladder-bar ${ok ? "is-passing" : "is-failing"}`} style=${`grid-column:${bar}`}></span>
              <span class=${`ladder-tag ${ok ? "is-passing" : "is-failing"} ${tail ? "is-before" : ""}`}
                style=${`grid-column:${label}`}>
                ${ramp[pair.i].key}&ndash;${ramp[pair.j].key} ${pair.contrast.toFixed(1)}:1
              </span>
            </div>
          `;
        })}
      </div>
    `;
  }

  private table(ramp: Step[]) {
    return html`
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Shade</th><th>Position</th><th>After curve</th><th>Target</th><th>Reached</th><th>Color</th></tr>
          </thead>
          <tbody>
            ${ramp.map(
              (s) => html`
                <tr>
                  <td>${s.key}</td>
                  <td>${s.x.toFixed(3)}</td>
                  <td>${s.t.toFixed(3)}</td>
                  <td>${s.target.toFixed(2)}:1</td>
                  <td class=${Math.abs(s.reached - s.target) > s.target * 0.05 ? "is-miss" : ""}>
                    ${s.reached.toFixed(2)}:1
                  </td>
                  <td><span class="dot" style=${`background:${s.hex}`}></span>${s.hex}</td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  render() {
    const subject = this.current;
    const ramp = this.ramp;
    const points: CurvePoint[] = ramp.map(({ x, t, hex }) => ({ x, t, hex }));

    return html`
      <div class="scale-presets">${SCALE_PRESETS.map((p) => this.preset(p))}</div>

      ${this.subjects(subject)}
      ${this.controls(subject)}

      <div class="stage">
        <ig-curve-editor
          .curve=${this.curve}
          .points=${points}
          low=${`${this.lo.toFixed(2)}:1`}
          high=${`${this.hi.toFixed(2)}:1`}
          @curve-change=${({ detail }: CustomEvent<Curve>) => {
            this.curve = detail;
          }}
        ></ig-curve-editor>

        <div class="strip is-attached">
          ${ramp.map(
            (s) => html`
              <span class="swatch" style=${`background:${s.hex};color:${readableOn(toRgb(s.hex))}`}
                title=${`${s.key}  ${s.hex}\n${s.reached.toFixed(2)}:1 against ${subject.anchor}`}>
                <span class="swatch-key">${s.key}</span>
                <span class="swatch-ratio">${s.reached.toFixed(1)}:1</span>
              </span>
            `,
          )}
        </div>

        ${this.ladder(ramp)}
      </div>

      ${this.table(ramp)}

      <ig-code-block .code=${this.code}></ig-code-block>
    `;
  }
}

define("ig-view-scales", ViewScales);

declare global {
  interface HTMLElementTagNameMap {
    "ig-view-scales": ViewScales;
  }
}
