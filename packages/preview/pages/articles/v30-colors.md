# Ignite UI Theming v30: This one is about colors.

Someone hands you a hex code. It's the brand color, and the entire application should use it.

The first button is easy. Then you need a quiet background for a selected row, a stronger color for its text, a hover state, then a border. The success message needs the same treatment in green. The warning needs it in amber. By the time you have finished, that one brand color has become a small collection of decisions about how the interface works together.

Now imagine doing it again for another starting color.

A palette generator should make that work easier for whatever color arrives in the brief: a deep navy, a pale mint, a vivid orange. Each needs a usable range of shades, from quiet backgrounds to strong accents and dark text.

Our previous palette generator in Ignite UI Theming could produce a pleasant scale from some seeds. Give it a very dark or very light color, though, and its limitations became obvious. A dark seed could produce an entire family of dark shades. A pale seed could produce several tokens that all resolved to white. You had ten numbered shades, but fewer useful choices.

That is a fairly fundamental shortcoming for a tool whose input is supposed to be *your* color. We had made the quality of the result too dependent on where that color happened to start. The work of compensating for our algorithm fell back on the person using it.

Our new fitted palette generator addresses that problem by separating the character of a color from the shape of its scale. A dark seed can yield pale tints; a pale seed can yield deep shades. The generator adapts to the hue's available color range, and you can control how the shades are distributed. Predictable contrast is part of that structure, alongside a more basic goal: producing a useful family from the color you actually want to use.

To see why that required a different approach, it helps to look at what the old generator did.

We call the input color a *seed*. It becomes a family such as `primary`, with ten numbered shades from `50` to `900`. The color families also get four accent shades, `A100` to `A700`; most of what follows is about the numbered ten. In the old generator, the seed occupied `500`. The other shades were calculated by multiplying its HSL saturation and lightness by fixed values.

For shade `50`, the lightness multiplier was 1.78. Starting at 50% lightness, that gives you 89%: a plausible pale shade. Starting at 10%, it gives you 17.8%. The shade labeled as the lightest in the family is still dark.

At the other extreme, start at 90% lightness. The first four shade calculations exceed 100%, so all four resolve to white. At the dark end, shade `900` uses a multiplier of 0.64, leaving it at 57.6% HSL lightness. The scale has lost distinctions at one end and never reaches a deep shade at the other.

Here are two concrete inputs, compiled through both generators:

| Seed | Legacy result | Fitted result |
| --- | --- | --- |
| Dark blue, `hsl(210 80% 10%)` | `50` is `#012d5a`; `900` is `#001021`. Every shade stays dark. | Ten distinct shades, from `#e4ecf8` to `#0a1623`. |
| Pale blue, `hsl(210 80% 90%)` | `50` through `300` are all white; `900` is `#2793ff`. | Ten distinct shades, from `#e4edf7` to `#0b1621`. |

<ig-view-seeds></ig-view-seeds>

The practical difference is the range of decisions those shades let you make. With the fitted navy family, you have a pale background available without inventing a separate color. With the fitted pale blue, you have deep shades available for emphasis and text. And distinct shades give you options for states and hierarchy that repeated white swatches cannot provide.

<ig-view-shades></ig-view-shades>

*Compare the legacy and fitted rows end to end: how light the lightest shade gets, how dark the darkest gets, and how evenly the steps between them are spaced. Then select a shade to measure the others against it.*

Pinning every seed to `500` was convenient, but it treated every input as though it belonged in the middle of a usable scale. A near-black navy and an almost-white blue plainly do not. Multiplying outward from that fixed position carries the seed's limitations through the whole family.

The fitted generator lets the numbered shades take their positions from the scale instead. The seed guides their hue and colorfulness, while the scale determines the range of shades and how they are distributed. The original color remains available as `--ig-primary-seed`; it no longer has to do double duty as the middle shade. Near-neutral seeds produce neutral families rather than acquiring an arbitrary strong hue.

This is the first lesson from the redesign: a seed should give a palette its character without trapping every shade near its starting lightness.

There is a second dimension to the problem. Even seeds with the same HSL lightness can behave very differently across hues.

Yellow and blue make this particularly easy to see. Both can have an HSL lightness of 50%, yet the yellow looks much lighter. Lea Verou uses this example in [her explanation of LCH](https://lea.verou.me/blog/2020/04/lch-colors-in-css-what-why-and-how/). A slider labeled “lightness” is not necessarily measuring what your eyes think it is measuring.

Moving to OKLCH helps. Its lightness, chroma, and hue coordinates give us a more perceptually consistent way to describe color. Chroma is roughly how colorful a shade is: reduce it toward zero and the shade approaches gray. But even a perceptual color space does not turn equal lightness steps into guaranteed WCAG contrast ratios. Those are different measurements. [Björn Ottosson's introduction to Oklab](https://bottosson.github.io/posts/oklab/) explains the model underlying OKLCH.

There is another constraint: some combinations of lightness and chroma fall outside the color range we are generating for.

Imagine making a blue progressively paler while insisting that it remain just as colorful. Eventually, there is no sRGB color that satisfies both requests. The available chroma depends on the hue and the lightness; it narrows toward white and black. Colors outside that range need to be mapped back into it, and careless clipping can distort the result. Ottosson illustrates the problem in [his work on sRGB gamut clipping](https://bottosson.github.io/posts/gamutclipping/).

<ig-view-sweep></ig-view-sweep>

*Move through the hues in the sweep demo. The plotted boundary shows how much room sRGB gives each hue at different lightnesses. Try the higher saturation setting to make the limits easier to see.*

Our previous generator did not fit its adjustments to that boundary. At higher saturation, it could ask for colors outside sRGB and leave the display conversion to resolve them. That is another place where a neat sequence of calculated values could conceal a less useful result.

This is what “fitted” refers to. Each family is built with its hue's available color range in mind. The generator varies chroma across the scale, tapering it toward the ends, and solves for the lightness needed to reach each contrast target. It measures contrast after gamut mapping, so the target concerns the color that can actually be emitted. The accents are solved the same way, against fixed targets of their own and at the edge of what the hue can hold, which is what keeps them vivid.

The seed supplies the starting character of the family. The scale supplies its contrast structure.

Separating those two things is what makes the feature useful across brands. You can change the color without inventing a new structure, or change the structure without editing each shade by hand.

Once the generator can build a full scale independently of the seed's starting lightness, we can give that scale more useful rules. Contrast is one of them.

Consider a label on a tinted background:

```css
.status {
  background: var(--ig-primary-100);
  color: var(--ig-primary-600);
}
```

Having a pale shade and a dark shade available is a start. Knowing that they work together is better. For ordinary text, the WCAG AA minimum contrast is 4.5:1. [WCAG's contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) explains the threshold and its exceptions.

The default fitted scale is designed so that shades five positions apart clear that threshold: `50` with `500`, `100` with `600`, `200` with `700`, `300` with `800`, and `400` with `900`. That gives component authors a repeatable pairing rule when the seed changes.

There is a small, useful piece of arithmetic behind that structure. Suppose two opaque shades have contrast ratios of 2:1 and 10:1 against white. Their contrast against each other is 10 ÷ 2, or 5:1. Because they share the same white reference, the common part of the contrast formula cancels out.

The default `even` scale uses that relationship. Its targets run from approximately 1.18:1 to 18.23:1 against white, with each step multiplying the previous target by the same amount. Across five steps, that produces a little over 4.5:1. Equal proportional steps make the useful pairings repeat across the scale.

We tested the generator across a wide range of seeds, checking contrast, shade distinctness, and whether the resulting colors stay within sRGB.

For someone using the application, the benefit is straightforward: the text on that tinted label can remain legible when the theme changes. For the team building it, fewer brand changes should require a second round of component-specific color repairs.

You can start with a familiar palette call:

```scss
@use 'igniteui-theming' as ig;

$brand: ig.palette(
  $primary: #0099ff,
  $secondary: #df1b74,
  $surface: #ffffff
);

@include ig.palette($brand);
```

The fitted generation is the default. The mixin emits the CSS custom properties used in the label example. The palette is generated during the build; using it does not require a JavaScript color solver in your application.

Separating the seed from the scale also opens up choices that our old multiplier tables kept fixed. You can retain a brand color while changing the distribution of its supporting shades.

The default distribution is a useful starting point, but interfaces have different needs. You might want several closely spaced pale backgrounds, a more pronounced middle, or neutrals that resemble an existing design system. Those choices belong in the scale.

A scale has two controls: a **range**, which sets the first and last contrast targets, and an optional **curve**, which redistributes the shades between them. The curve uses the same four control-point values as a CSS cubic Bézier easing function. In an animation, easing decides how progress is distributed over time. Here, it decides how progress is distributed through the contrast range.

<ig-view-scales></ig-view-scales>

*Start with `even`, then try `material`, `tailwind`, and `carbon`. Watch both the shades and the five pair measurements. Next, move a curve handle: bringing shades closer together in one part of the scale changes the contrast available between them. For the grays, switch what the scale is measured from, the page or white.*

The named presets offer familiar distributions. `material` follows this library's original grayscale; `tailwind` and `carbon` are fitted to Tailwind v4's slate and IBM Carbon's gray scale. They provide a starting rhythm for your own colors, rather than importing those systems' complete palettes.

You can choose a preset for one family:

```scss
$brand: ig.palette(
  $primary: #0099ff,
  $secondary: #df1b74,
  $surface: #ffffff,
  $scales: ('gray': 'carbon')
);
```

Or describe a scale directly in the same call:

```scss
$scales: (
  'primary': (
    range: 1.1 14,
    curve: 0.5 0 0.8 0.8
  )
)
```

That second example deliberately changes the contrast structure. The default five-pair guarantee does not automatically follow it. A narrower range or a curve that bunches shades together can take a pairing below 4.5:1. The demo exposes that tradeoff as you edit, and its Sass output carries your choices into the theme.

This is also why the default gray scale deserves its own mention. Gray uses `material`, preserving the familiar distribution of the library's neutrals, in light themes and in dark ones, where our components were tuned against them too. On white, that preset passes three of the five tested pairings. We have retained a compatibility choice with a measurable tradeoff, so describing every default family as satisfying the five-pair rule would overstate what we have built. You can select `even` for gray too.

The background is especially important for neutrals. A gray that is subtle on white may be conspicuous on a dark page. So a scale has a third setting that only gray reads: its **anchor**, what the range is measured against.

With `anchor: 'surface'`, the default for `even`, `tailwind`, `carbon` and any scale you write yourself, gray measures its targets against the supplied surface. Shade `50` stays close to that background and higher numbers move farther away. In a light theme they get darker; in a dark theme they get lighter. This gives the tokens a useful continuity across themes: low numbers mean low contrast with the page, whatever the page is.

With `anchor: 'white'`, gray is measured against white, the way the original grayscale was built. The ten grays are the same colors in every theme; on a dark surface they run in reverse, so `50` is the darkest. That is what `material` uses, and why moving an existing dark theme to the fitted generator leaves its components looking the way they did.

```scss
$scales: (
  'gray': (
    range: 1.1 14,
    anchor: 'white'
  )
)
```

Measuring from the page also makes a physical limit visible. White against a dark gray background cannot reach the full 21:1 available between white and black. If a surface-anchored scale requests more contrast than the background permits, its endpoint cannot be reached. The Sass generator returns its closest result and warns when the target miss exceeds its tolerance. The scale demo reports the available ceiling, making it easier to choose a workable range.

<ig-view-neutrals></ig-view-neutrals>

*Switch between the light and dark themes. Compare how the gray scale moves away from the page, then look at the layers in the interface preview.*

The old palette treated the surface as another numbered color family. That kept the API uniform, but it was a poor description of what a page background and its layers are for. It asked component authors to translate a spatial decision—this panel sits above the page—into an arbitrary shade number.

Those layers now have names: `base`, `sunken`, `raised`, `overlay`, and `container`. A surface describes where something sits in the interface, so asking for a raised surface expresses more intent than asking for surface shade `200`. The container role supplies a translucent layer; the other roles derive from the base color.

On a pure-white base, a raised layer cannot become whiter. It resolves to the base color, leaving borders or shadows to communicate the separation. Explicit roles make that behavior easier to reason about.

For existing themes, this improvement also creates migration work. Fitted surfaces use these roles in place of numbered shades. References such as `--ig-surface-500` need to be reviewed and mapped to the appropriate role. That is a cost of correcting the model, and it falls on and the people who built against the API we provided. The legacy generator remains available while you migrate your components and apps.

The broader idea has good precedents. [Adobe Leonardo](https://leonardocolor.io/) generates colors from target contrast ratios. [Radix](https://www.radix-ui.com/colors/docs/overview/custom-palettes) offers custom scales from reference colors. These are useful approaches to the same underlying need: making color relationships repeatable. Ignite UI Theming brings contrast targets, hue-aware fitting, configurable scales, and surface-aware neutrals into its existing Sass palette function.

A generated palette still needs to be used deliberately. The five-pair rule concerns the default numbered color scales, not arbitrary combinations, translucent overlays, or every UI state. Check the rendered foreground and background, especially after customizing a scale. Contrast is one part of an accessible interface.

The lesson for us is that accepting a color as input is only part of supporting it. The old generator could accept a deep navy or a pale blue without producing the range of shades an interface needed. Its fixed recipe also left useful contrast relationships to chance. The fitted generator takes responsibility for more of that work: building the range, adapting colorfulness to the hue, and giving the shades a structure you can inspect and change.

That gives us something concrete to improve from here. The sweep covers a defined set of seeds; custom scales and real interfaces introduce more combinations. Keeping those limits visible matters as much as showing the cases that pass. When a new case exposes a weakness, it gives us another behavior to account for and another regression to guard against.

For the people building with the library, the aim is freedom to start with the color their product needs, with fewer repairs and more control over the resulting palette. For the people using their applications, it is a coherent interface with useful distinctions between backgrounds, states, and emphasis, and text that remains readable. Those are the outcomes a palette generator should help us deliver—and the ones we can now hold ours to more explicitly.
