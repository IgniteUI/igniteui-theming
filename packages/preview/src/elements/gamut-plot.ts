import { css, html, LitElement, type SVGTemplateResult, svg } from "lit";
import {
  CHROMA_CEILING,
  type Cusp,
  encode,
  GAMUT_HIGH,
  GAMUT_LOW,
  gamutCusp,
  oklabToLinear,
  rgbToOklch,
  toRgb,
} from "../color.js";
import type { SweepRamp } from "../data/color/sweep.js";
import { define } from "../define.js";
import { isClamped, shadeHex, shadeRgb } from "../ramp.js";
import { SHADES } from "../variants.js";

/** The plot's coordinate space. The canvas and the SVG over it share it exactly. */
const PLOT = {
  width: 400,
  height: 300,
  left: 46,
  right: 384,
  top: 16,
  bottom: 260,
};
const px = (C: number) =>
  PLOT.left + (C / CHROMA_CEILING) * (PLOT.right - PLOT.left);
const py = (L: number) => PLOT.bottom - L * (PLOT.bottom - PLOT.top);

/**
 * A slice through sRGB at one hue, with both generators' shades placed on it.
 *
 * The lit region is every color the hue can produce. Painted per pixel on a canvas at
 * one device pixel per CSS pixel: the field is a smooth gradient the browser scales up
 * cleanly, and everything that needs to stay crisp — axes, ticks, marks — is SVG over it.
 */
export class GamutPlot extends LitElement {
  static properties = {
    seed: { type: String },
    legacy: { attribute: false },
    fitted: { attribute: false },
  };

  static styles = css`
    :host {
      display: block;
      color: var(--plot-ink, currentColor);
    }

    .plot {
      position: relative;
      aspect-ratio: ${PLOT.width} / ${PLOT.height};
      border: 1px solid var(--line);
      border-radius: var(--radius-sm, 3px);
      background: var(--panel);
      overflow: hidden;
    }

    canvas,
    svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .tick {
      font-family: var(--mono, ui-monospace, monospace);
      font-size: 9px;
      fill: currentColor;
      opacity: 0.8;
    }

    .axis {
      letter-spacing: 0.08em;
      opacity: 0.6;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-4, 16px);
      margin-block-start: var(--space-3, 12px);
      font-family: var(--mono, ui-monospace, monospace);
      font-size: var(--text-xs, 11px);
      color: var(--muted);
    }

    .legend span {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .mark {
      flex: none;
      width: 9px;
      height: 9px;
      border: 1.5px solid currentColor;
      background: currentColor;
    }

    .mark.is-fitted,
    .mark.is-asked {
      border-radius: 50%;
    }

    .mark.is-asked {
      background: transparent;
    }
  `;

  declare seed: string;
  declare legacy: SweepRamp;
  declare fitted: SweepRamp;

  private cusps = new Map<string, Cusp>();
  private paintedHue = Number.NaN;

  constructor() {
    super();
    this.seed = "#000000";
    this.legacy = { hex: "", mask: 0, ask: [] };
    this.fitted = { hex: "", mask: 0, ask: [] };
  }

  /** Memoised: finding the cusp is 100 bisections, and it is read several times a render. */
  private get cusp(): Cusp {
    const cached = this.cusps.get(this.seed);
    if (cached) return cached;

    const cusp = gamutCusp(rgbToOklch(toRgb(this.seed))[2]);
    this.cusps.set(this.seed, cusp);
    return cusp;
  }

  updated() {
    this.paint();
  }

  /** Only the hue moves the field, so a render for any other reason reuses the canvas. */
  private paint() {
    const canvas = this.renderRoot.querySelector("canvas");
    const context = canvas?.getContext("2d");
    const { hue } = this.cusp;
    if (!canvas || !context || hue === this.paintedHue) return;

    const { width, height, left, right, top, bottom } = PLOT;
    canvas.width = width;
    canvas.height = height;

    const image = context.createImageData(width, height);
    const radians = (hue * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    for (let y = top; y <= bottom; y++) {
      const L = (bottom - y) / (bottom - top);

      for (let x = left; x <= right; x++) {
        const C = ((x - left) / (right - left)) * CHROMA_CEILING;
        const [r, g, b] = oklabToLinear(L, C * cos, C * sin);

        if (r < GAMUT_LOW || r > GAMUT_HIGH) continue;
        if (g < GAMUT_LOW || g > GAMUT_HIGH) continue;
        if (b < GAMUT_LOW || b > GAMUT_HIGH) continue;

        const i = (y * width + x) * 4;
        image.data[i] = encode(r);
        image.data[i + 1] = encode(g);
        image.data[i + 2] = encode(b);
        image.data[i + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
    this.paintedHue = hue;
  }

  /** Where each clamped legacy shade asked to be, with a leader to where it landed. */
  private asked(): SVGTemplateResult[] {
    const marks: SVGTemplateResult[] = [];
    let n = 0;

    SHADES.forEach((_, i) => {
      if (!isClamped(this.legacy, i)) return;

      const ask = this.legacy.ask;
      const [askL, askC] = rgbToOklch([
        ask[n * 3],
        ask[n * 3 + 1],
        ask[n * 3 + 2],
      ]);
      const [landedL, landedC] = rgbToOklch(shadeRgb(this.legacy, i));
      const ax = Math.min(px(Math.min(askC, CHROMA_CEILING)), PLOT.right);
      const ay = py(Math.max(0, Math.min(1, askL)));
      n++;

      marks.push(svg`
        <line x1=${ax} y1=${ay} x2=${px(landedC)} y2=${py(landedL)}
          stroke="currentColor" stroke-width=".75" opacity=".5" stroke-dasharray="2 2" />
        <circle cx=${ax} cy=${ay} r="3.4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".8" />
      `);
    });

    return marks;
  }

  private marks(ramp: SweepRamp, shape: "square" | "circle") {
    return SHADES.map((_, i) => {
      const [L, C] = rgbToOklch(shadeRgb(ramp, i));
      const fill = shadeHex(ramp, i);

      return shape === "square"
        ? svg`<rect x=${px(C) - 4.7} y=${py(L) - 4.7} width="9.4" height="9.4"
            fill=${fill} stroke="currentColor" stroke-width="1.5" />`
        : svg`<circle cx=${px(C)} cy=${py(L)} r="5.2"
            fill=${fill} stroke="currentColor" stroke-width="1.5" />`;
    });
  }

  render() {
    const cusp = this.cusp;
    const { left, right, top, bottom } = PLOT;

    return html`
      <div class="plot">
        <canvas></canvas>
        <svg viewBox=${`0 0 ${PLOT.width} ${PLOT.height}`} role="img"
          aria-label="Lightness against chroma at this hue, showing where each generator places its shades">
          <line x1=${left} y1=${top} x2=${left} y2=${bottom} stroke="currentColor" stroke-width="1" opacity=".45" />
          <line x1=${left} y1=${bottom} x2=${right} y2=${bottom} stroke="currentColor" stroke-width="1" opacity=".45" />
          ${[0, 0.25, 0.5, 0.75, 1].map(
            (L) =>
              svg`<text x=${left - 7} y=${py(L) + 3} text-anchor="end" class="tick">${L.toFixed(2)}</text>`,
          )}
          ${[0, 0.1, 0.2, 0.3].map(
            (C) =>
              svg`<text x=${px(C)} y=${bottom + 14} text-anchor="middle" class="tick">${C.toFixed(1)}</text>`,
          )}
          <text x=${left} y=${bottom + 32} class="tick axis">CHROMA</text>
          <text x="11" y=${top + 4} transform=${`rotate(-90 11 ${top + 4})`} text-anchor="end" class="tick axis">LIGHTNESS</text>
          <line x1=${px(cusp.C)} y1=${py(cusp.L)} x2=${px(cusp.C) + 14} y2=${py(cusp.L)}
            stroke="currentColor" stroke-width="1" opacity=".55" />
          <text x=${px(cusp.C) + 18} y=${py(cusp.L) + 3} class="tick">cusp ${cusp.C.toFixed(2)}</text>
          ${this.asked()}
          ${this.marks(this.legacy, "square")}
          ${this.marks(this.fitted, "circle")}
        </svg>
      </div>
      <p class="legend">
        <span><span class="mark is-legacy"></span>legacy</span>
        <span><span class="mark is-fitted"></span>fitted</span>
        <span><span class="mark is-asked"></span>asked for, clamped back</span>
      </p>
    `;
  }
}

define("ig-gamut-plot", GamutPlot);

declare global {
  interface HTMLElementTagNameMap {
    "ig-gamut-plot": GamutPlot;
  }
}
