/**
 * The scale table is a lookup standing in for the generator, so the thing worth testing
 * is that it agrees with the generator. If this drifts, the editor lies.
 */
import { describe, expect, it } from "vitest";
import { AA, contrast, toRgb } from "../../color.js";
import {
  rampFromTable,
  SCALE_PRESETS,
  type ScalePreset,
} from "../../scale-math.js";
import { SHADES, type Theme } from "../../variants.js";
import { resolve } from "../cache.js";
import { compile } from "./sass-util.js";
import { type ScaleSubject, scaleData } from "./scales.js";

/** What the generator itself produces for a subject under a shipped scale. */
const rampFromSass = (subject: ScaleSubject, preset: ScalePreset) => {
  const surface =
    subject.family === "gray" ? `, $surface: ${subject.surface}` : "";
  const { css } = compile(
    `@use 'sass:map';\n@use 'sass/color' as *;\n@use 'sass/color/types' as types;\n` +
      `o { $s: shades('${subject.family}', ${subject.seed}, types.$INumericShades${surface}, $scale: '${preset.name}');\n` +
      SHADES.map((v) => `  v${v}: '#{map.get($s, "${v}-raw")}';`).join("\n") +
      "\n}",
  );

  return [...css.matchAll(/v\d+:\s*"([^"]+)"/g)].map(([, literal]) =>
    toRgb(literal),
  );
};

const rampFromData = (subject: ScaleSubject, preset: ScalePreset) =>
  rampFromTable(subject.table, preset).map((h) => toRgb(`#${h}`));

/** How many of the five "500 apart" pairs clear AA, under one preset, for one subject. */
const record = (subject: ScaleSubject, name: string) => {
  const preset = SCALE_PRESETS.find((p) => p.name === name);
  if (!preset) throw new Error(`no preset ${name}`);

  const ramp = rampFromData(subject, preset);
  let clear = 0;

  for (let i = 0; i + 5 < ramp.length; i++) {
    if (contrast(ramp[i], ramp[i + 5]) >= AA) clear++;
  }

  return clear;
};

// The real cache: the provider compiles thousands of Sass rules and the result is keyed
// by its inputs, so a warm run here is the same data the dev server serves.
const data = await resolve(scaleData);

/**
 * Subjects are derived from the shipped palettes, so they are addressed by what they
 * are rather than by a key that moves when a preset's seeds change.
 */
const neutral = (theme: Theme) => {
  const found = data.subjects.find(
    (s) => s.family === "gray" && s.presets.includes(`material-${theme}`),
  );
  if (!found) throw new Error(`no material ${theme} neutral`);

  return found;
};

describe("the scale lookup table", () => {
  for (const subject of data.subjects) {
    for (const preset of SCALE_PRESETS) {
      it(`reproduces ${preset.name} on ${subject.key}`, () => {
        const got = rampFromData(subject, preset);
        const want = rampFromSass(subject, preset);
        const worst = Math.max(
          ...got.map((c, i) =>
            Math.max(...c.map((v, ch) => Math.abs(v - want[i][ch]))),
          ),
        );

        // Sampling 400 targets geometrically leaves adjacent entries about half a
        // percent of contrast apart, so a shade can land one step either side. Across
        // all five subjects and four presets: 78% exact, 99% within one, never above two.
        expect(worst).toBeLessThanOrEqual(2);
      });
    }
  }

  it("reports a ceiling a subject cannot exceed", () => {
    for (const subject of data.subjects) {
      const anchor = toRgb(subject.anchor);
      const { samples, rows } = subject.table;
      const reached = rows.flatMap((row) =>
        Array.from({ length: samples }, (_, k) =>
          contrast(toRgb(`#${row.slice(k * 6, k * 6 + 6)}`), anchor),
        ),
      );

      expect(Math.max(...reached)).toBeLessThanOrEqual(subject.ceiling + 0.001);
    }
  });

  it("anchors a neutral family to its page rather than to white", () => {
    const dark = neutral("dark");
    expect(dark.anchor).not.toBe("#ffffff");
    // White on a dark page cannot reach the 21:1 a white page allows.
    expect(dark.ceiling).toBeLessThan(18);
  });
});

describe("the AA record each preset carries", () => {
  // `$scales` documents these against the grayscale the presets were fitted to.
  it("matches the documented figures on the neutral family", () => {
    const light = neutral("light");

    expect(record(light, "even")).toBe(5);
    expect(record(light, "material")).toBe(3);
    expect(record(light, "tailwind")).toBe(5);
    expect(record(light, "carbon")).toBe(5);
  });

  it("is stable across subjects that can reach the range", () => {
    const reachable = data.subjects.filter((s) => s.ceiling >= 16.1);
    const records = reachable.map((s) => record(s, "material"));

    expect(reachable.length).toBeGreaterThan(1);
    expect(new Set(records).size).toBe(1);
  });

  it("degrades when the range asks for more contrast than the subject has", () => {
    // `even` reaches for 18.232:1. A neutral on a dark page tops out below 17, so the
    // ramp compresses at the dark end and a pair drops under AA. The guarantee is
    // conditional on the range being reachable, and the ceiling is what tells you.
    const dark = neutral("dark");

    expect(dark.ceiling).toBeLessThan(18.232);
    expect(record(dark, "even")).toBeLessThan(5);
  });

  it("holds for the straight line wherever the range is reachable", () => {
    for (const subject of data.subjects) {
      if (subject.ceiling < 18.232) continue;
      expect(record(subject, "even")).toBe(5);
    }
  });
});
