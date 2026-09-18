import type { SectionDef } from "../types.js";

export const color: SectionDef = {
  id: "color",
  title: "Color",
  blurb:
    "Give the generator one color and it makes ten shades of it. Pick one of the palettes that ship with the library and see how its seed colors play out in every demo below.",
  controls: {
    tag: "ig-color-controls",
    load: () => import("./controls.js"),
  },
  views: [
    {
      id: "shades",
      title: "Shades",
      teaches:
        "What changes when each shade is cut to suit its own hue, instead of every color going through the same multiplication table.",
      tag: "ig-view-shades",
      load: () => import("./shades.js"),
    },
    {
      id: "neutrals",
      title: "Neutrals",
      teaches:
        "Why the surface family became five named roles instead of ten numbered shades, and what a grayscale gains from being anchored to the page.",
      tag: "ig-view-neutrals",
      load: () => import("./neutrals.js"),
    },
    {
      id: "scales",
      title: "Scales",
      teaches:
        "How a scale decides where the ten shades land, and what it costs you when the light end gets crowded.",
      tag: "ig-view-scales",
      load: () => import("./scales.js"),
    },
    {
      id: "sweep",
      title: "Sweep",
      teaches:
        "The proof: 1,080 seed colors run through both generators, and why the range of colors a screen can show matters.",
      tag: "ig-view-sweep",
      load: () => import("./sweep.js"),
    },
  ],
};
