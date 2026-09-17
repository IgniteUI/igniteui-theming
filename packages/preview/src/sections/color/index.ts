import type { SectionDef } from "../types.js";

export const color: SectionDef = {
  id: "color",
  title: "Color",
  blurb:
    "One seed becomes ten shades. Pick a palette the library ships and watch the same seeds run through every view below.",
  controls: {
    tag: "ig-color-controls",
    load: () => import("./controls.js"),
  },
  views: [
    {
      id: "shades",
      title: "Shades",
      teaches:
        "What changes when shades are cut to their own hue instead of multiplied by a fixed table.",
      tag: "ig-view-shades",
      load: () => import("./shades.js"),
    },
    {
      id: "neutrals",
      title: "Neutrals",
      teaches:
        "Why surface stopped being ten numbered shades, and what a family anchored to the page buys you at either extreme.",
      tag: "ig-view-neutrals",
      load: () => import("./neutrals.js"),
    },
    {
      id: "scales",
      title: "Scales",
      teaches:
        "How a scale decides where the ten shades sit, and what a bunched light end costs you.",
      tag: "ig-view-scales",
      load: () => import("./scales.js"),
    },
    {
      id: "sweep",
      title: "Sweep",
      teaches:
        "The receipts: 1080 seeds through both generators, and what the sRGB gamut has to do with it.",
      tag: "ig-view-sweep",
      load: () => import("./sweep.js"),
    },
  ],
};
