/**
 * The names a palette is addressed by. A leaf module on purpose: both the Sass-compiling
 * providers and the browser bundle need these, and a provider drags `sass-embedded` in
 * with it.
 */
export const FAMILIES = [
  "primary",
  "secondary",
  "gray",
  "surface",
  "info",
  "success",
  "warn",
  "error",
] as const;

export const SHADES = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
] as const;

export const ACCENTS = ["A100", "A200", "A400", "A700"] as const;

export const ROLES = [
  "base",
  "sunken",
  "raised",
  "overlay",
  "container",
] as const;

export const THEMES = ["light", "dark"] as const;

/** The palettes the library ships, in the order the picker offers them. */
export const PRESETS = [
  { key: "material", label: "Material" },
  { key: "bootstrap", label: "Bootstrap" },
  { key: "fluent", label: "Fluent" },
] as const;

export type Family = (typeof FAMILIES)[number];
export type Shade = (typeof SHADES)[number];
export type Accent = (typeof ACCENTS)[number];
export type RoleKey = (typeof ROLES)[number];
export type Theme = (typeof THEMES)[number];
export type PresetKey = (typeof PRESETS)[number]["key"];

export const isTheme = (value: unknown): value is Theme =>
  THEMES.includes(value as Theme);

export const isPresetKey = (value: unknown): value is PresetKey =>
  PRESETS.some((preset) => preset.key === value);
