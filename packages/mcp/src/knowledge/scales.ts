/**
 * Shade scales - the rhythm a color family follows from its lightest shade to its darkest.
 *
 * The data is generated from `config.$scales` in the Sass by buildJSON.mjs, so the presets
 * here cannot drift from the ones the generator actually ships.
 */

import { FamilyScales, ShadeScales } from "igniteui-theming";

export interface ShadeScale {
  /** WCAG contrast at the lightest and darkest shade, measured against white. */
  range: [number, number];
  /** Cubic-bezier control points, or null for the straight line. */
  curve: [number, number, number, number] | null;
}

const toScale = (raw: { range: string[]; curve: string[] }): ShadeScale => ({
  range: [Number(raw.range[0]), Number(raw.range[1])],
  curve:
    raw.curve.length === 4 && raw.curve[0] !== ""
      ? (raw.curve.map(Number) as [number, number, number, number])
      : null,
});

/** Every built-in scale, keyed by name. */
export const SHADE_SCALES: Record<string, ShadeScale> = Object.fromEntries(
  Object.entries(ShadeScales).map(([name, raw]) => [name, toScale(raw)]),
);

/** The names a `scales` argument accepts. */
export const SCALE_NAMES = Object.keys(SHADE_SCALES);

/** Which scale each family uses when none is given. Unlisted families use `even`. */
export const FAMILY_SCALES: Record<string, string> = FamilyScales;

/** What each preset is for, in one line. Keyed to the generated scale names. */
export const SCALE_NOTES: Record<string, string> = {
  even: "Straight line. Every pair of shades 500 apart clears WCAG AA - the only preset that guarantees it.",
  material:
    "This library's original grayscale. Familiar rhythm, but 2 of the 5 AA pairs fall short.",
  tailwind: "Fitted to Tailwind v4 slate. Keeps all 5 AA pairs.",
  carbon: "Fitted to IBM Carbon gray 10-100. Keeps all 5 AA pairs.",
};

/**
 * The on-demand guidance for shade scales. Built from SHADE_SCALES, so the numbers here are
 * whatever the Sass currently ships.
 */
export function buildScalesGuidance(): string {
  const rows = SCALE_NAMES.map((name) => {
    const scale = SHADE_SCALES[name];
    const curve = scale.curve
      ? `\`${scale.curve.join(", ")}\``
      : "straight line";

    return `| \`${name}\` | ${scale.range[0]}:1 → ${scale.range[1]}:1 | ${curve} | ${SCALE_NOTES[name] ?? ""} |`;
  });

  const defaults = Object.entries(FAMILY_SCALES)
    .map(([family, name]) => `\`${family}\` uses \`${name}\``)
    .join("; ");

  return `# Shade scales

A scale is the *rhythm* of a color family - where each shade sits between the lightest and
the darkest. It never changes the hue; the seed color still decides that.

Two numbers describe it:

- **range** - the WCAG contrast the family spans, from shade 50 to shade 900, measured
  against white (or against the background, for \`gray\`). \`1.182 18.232\` means the lightest
  shade sits at 1.18:1 and the darkest at 18.23:1.
- **curve** - read exactly like a CSS \`cubic-bezier()\` timing function. \`x\` is how far along
  the shades you are, \`y\` is how far into the contrast range. No curve is the straight line.

## Built-in scales

| name | range | curve | notes |
|------|-------|-------|-------|
${rows.join("\n")}

Defaults: ${defaults}. Every other family uses \`even\`.

## The tradeoff

An even spread is what makes any two shades 500 apart clear WCAG AA - shade 100 against 600,
200 against 700, and so on. Bunching the light end buys the familiar rhythm people expect
from Material-style palettes, and gives that guarantee up. \`material\` is the preset that
makes this trade; \`tailwind\` and \`carbon\` keep all five pairs.

Pick \`even\` when accessibility is the priority, a named preset when matching a look.

## Using one

Name a preset for every family, or per family:

\`\`\`scss
$p: palette(#09f, #f0f, #fff, $scales: 'carbon');
$p: palette(#09f, #f0f, #fff, $scales: ('gray': 'carbon'));
\`\`\`

## Matching a ladder from somewhere else

Do not hand-write control points. Call the \`fit_color_scale\` tool with the ladder's colors
ordered lightest first; it measures the range and least-squares fits the curve, and reports
how closely the result reproduces the original. Pass what it returns straight back as
\`scales\`.

Written inline, a fitted scale looks like this:

\`\`\`scss
$p: palette(#09f, #f0f, #fff, $scales: (
  'gray': (range: (1.05, 17.85), curve: (0.611, 0.06, 0.249, 0.46))
));
\`\`\`

\`range\` alone is valid too - it spans that contrast range on a straight line.

## Generators

\`$generator\` is a separate axis. \`fitted\` (the default) solves every shade for a contrast
target and is what scales apply to. \`legacy\` reproduces the original multiplier-based ramps and
ignores scales entirely; it exists so an existing theme can stay byte-identical while
migrating. Do not choose it for new work.
`;
}
