/**
 * Every embeddable demo, as plain data. The page script and the build both read it: the
 * embed registers `ig-demo-<key>` for each entry, and the build writes a frame page for
 * each and lists them all on the demos test page. Adding a demo starts here.
 */
export interface DemoInfo {
  /** What the demo is, for the test pages. */
  title: string;
  /**
   * The demo's own selection controls: none, the palette alone, or the palette and the
   * light/dark switch. Only demos whose colors depend on the page get the switch.
   */
  picker: "none" | "palette" | "palette+theme";
  /** Placeholder height while loading, close to the loaded height to avoid a jump. */
  reserve: number;
}

export const CATALOG = {
  seeds: { title: "Two seeds, both generators", picker: "none", reserve: 470 },
  shades: {
    title: "Shipped palettes, legacy and fitted",
    picker: "palette",
    reserve: 390,
  },
  sweep: { title: "Every hue, both generators", picker: "none", reserve: 980 },
  scales: { title: "Range, curve and anchor", picker: "none", reserve: 1210 },
  neutrals: {
    title: "Grayscale and surface roles",
    picker: "palette+theme",
    reserve: 980,
  },
} as const satisfies Record<string, DemoInfo>;

export type DemoName = keyof typeof CATALOG;

export const DEMO_NAMES = Object.keys(CATALOG) as DemoName[];
