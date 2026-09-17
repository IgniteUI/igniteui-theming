# Ten shades, one seed, and a guarantee

*Draft. The `<ig-view-*>` elements are the live demos — each one is a custom element from the preview bundle, and everything it shows is computed in the page, not a screenshot.*

---

Here is an uncomfortable fact about the palette Ignite UI has shipped for years.

Take its light Material theme. Take any of its colour families — primary, secondary, info, success, warn, error. Take shade 50 and shade 500, or 100 and 600, or any pair five steps apart. Check the contrast.

All thirty pairs fail WCAG AA.

Not *some*. Thirty of thirty. And Bootstrap and Fluent, built the same way, fail thirty of thirty too. If you have ever put shade 100 behind shade 600 and assumed the numbers were doing some work for you, they were not.

We rebuilt the shade generator. The new one fails none of them — not on these palettes, and not on the 1,080 seeds we threw at it. This post is about how, and more importantly about how you can check rather than believe. Every demo below runs the real thing.

## Pick a palette and look

<ig-view-shades></ig-view-shades>

Three counters at the top, all computed live from the shades on screen:

- **AA pairs that fail.** Any two shades 500 apart. Zero now, thirty before.
- **Duplicate shades.** Two tokens resolving to the same colour, so a border quietly vanishes into its fill.
- **Shades outside sRGB.** Colours no display can show, which the browser clips back to something it can — twenty of Material's sixty, fifteen of Bootstrap's and Fluent's.

Both sides start from exactly the same seeds. We read them out of the shipped palette rather than retyping them, so the comparison has nowhere to hide.

## Why a multiplier table cannot work

The old generator did what most of them do: take the seed in HSL, multiply saturation and lightness by a fixed table, ten entries in, ten entries out. It is simple, it is fast, and it is wrong for a reason worth understanding.

sRGB is not a box. It is a lumpy solid, and its shape changes with hue. The widest point of a hue — its **cusp**, where that hue holds the most colour before the display gives up — moves enormously as you go around the wheel. Across the spectrum the cusp varies by **more than twofold in chroma** and about **twofold in lightness**, and it never sits at either end of the lightness axis.

So a multiplier that produces a pleasant ramp for blue produces a washed-out one for yellow and an impossible one for magenta. "Impossible" is literal: the generator asks for a colour outside sRGB, and the browser clips it. Two shades that asked to be different land on the same clipped edge and become the same colour.

The new generator inverts the problem. Instead of multiplying the seed and hoping, it decides **what contrast each shade should have** and then finds the colour that hits it — working in OKLCH, cutting against the actual gamut boundary for that specific hue, and tapering chroma toward both ends so 50 reads as a tint and 900 as a near-neutral rather than as mud.

The guarantee falls out of the construction: any two shades 500 apart clear AA, because the contrast targets were chosen so they would.

## The receipts

<ig-view-sweep></ig-view-sweep>

Drag the hue slider. That is 360 hues at three saturations — **1,080 seeds**, both generators, every ramp precomputed so you can sweep it in real time.

The totals:

| | legacy | fitted |
|---|---|---|
| AA pairs that fail | 5,182 of 5,400 | **0** |
| Seeds with a clean ramp | 0 of 1,080 | **1,080** |
| Shades outside sRGB | 1,800 of 10,800 | **0** |

Zero seeds out of 1,080 produce a fully clean ramp under the old generator. Not a bad average — *none*.

One honest note on that gamut figure, because it is easy to overstate: all 1,800 clipped shades come from the 85%-saturation row. At 60% and 35% there are none. Clipping is a saturated-seed problem, not a universal one. The AA failures are universal.

The panel underneath is a slice through sRGB at whatever hue you have selected. The lit region is every colour that hue can produce; the hollow rings are shades the old table asked for and could not have, with a leader to where they actually landed. Sweep the hue and watch the region change shape — that changing shape is the whole argument against a fixed table, drawn.

## Surface was never a ramp

The old palette gave `surface` ten numbered shades, exactly like a colour family. It is not a colour family. It is the page, plus the layers that sit on it.

On a white page that fell apart completely. Material's light surface ramp has **five duplicate shades** and fails **all five** AA pairs — because a generator asked to make ten distinct steps away from `#ffffff` simply runs out of room and returns white, repeatedly.

Surface now has five named roles instead: `base`, `sunken`, `raised`, `overlay`, `container`. A role says what it is for, which means a component can ask for the right one rather than guessing that 200 is probably a card. And when a role has nowhere to go — `raised` on a pure-white page — it resolves onto the background deliberately, and the elevation shadow carries the depth instead of a colour difference that was never going to be visible.

<ig-view-neutrals></ig-view-neutrals>

The mock on the left is built entirely from those roles, text included. Switch the theme and watch it hold together in both.

The grayscale below it changed too: it is anchored to the page rather than to white, so shade 50 always sits nearest the background whichever theme you are in. No more inverting your mental model between light and dark.

## The knobs

Here is the part that actually differentiates this from a generator you cannot argue with.

A **scale** decides where the ten shades sit between the lightest and the darkest. It has two parts:

- **`range`** — the contrast of shade 50 and shade 900. `1.182` to `18.232` by default, measured against the anchor.
- **`curve`** — an optional cubic-bezier that redistributes the steps in between. No curve means evenly spaced by contrast.

That is it. Two numbers and four control points, and they are yours.

<ig-view-scales></ig-view-scales>

Four scales ship. `even` is the default and gives maximum separation. `material` reproduces the rhythm our grayscale has always had. `tailwind` matches Tailwind v4's slate, `carbon` matches IBM Carbon's gray 10–100 — both included because "make our palette feel like theirs" is a real request and a scale is the honest way to answer it.

Drag the two handles on the chart and watch the ramp below redraw. Bunch the light end and watch the guarantee ladder go red as pairs drop under 4.5:1. That is the trade a scale makes, made visible.

Two things this demo will tell you that a marketing page would not:

**The default gray scale knowingly costs you two pairs.** Select `material` and the record reads 3 of 5. The gray family defaults to that scale because the familiar rhythm was worth more to us than two pairs on a family that is mostly used for text and borders. It is a choice, it is documented, and `even` undoes it in one line.

**The guarantee is conditional on the range being reachable.** Switch the subject to a neutral on a dark page and push the range to its maximum. It fails — not because the generator broke, but because white on a `#222` page tops out around 15.6:1 and you asked for 18.2:1. The demo reports each subject's ceiling for exactly this reason. A guarantee that quietly degraded instead of telling you would be worse than no guarantee.

## What you write

```scss
$palette: palette(
  $primary: #0099ff,
  $secondary: #df1b74,
  $gray: #000000,
  $surface: #ffffff
);
```

Same call, same seeds, better shades. If you want a different rhythm:

```scss
$palette: palette(
  $primary: #0099ff,
  $surface: #ffffff,
  $scales: ('gray': 'carbon')
);
```

Or hand it a range and a curve directly:

```scss
$scales: ('primary': (range: 1.1 14, curve: 0.5 0 0.8 0.8))
```

**One migration note, stated plainly.** Surface no longer emits ten numbered shades, and components that still reference `--ig-surface-500` will need either the named roles or an alias onto `base`. That is the one breaking edge in this change, and it is the price of surface finally meaning something.

## Why the demos and not screenshots

Every number in this post is computed in your browser, from the same Sass that ships. The contrast ratios are measured, not asserted. The gamut cross-section is the real boundary for the hue you selected. The failing pairs go red because they failed, not because a designer coloured them red.

We think that is the right way to make a claim about colour. If we have got something wrong, the demo above will show you before we do.

---

*`igniteui-theming` is open source. The preview app these demos come from lives in the repository, and every figure here is covered by a test.*
