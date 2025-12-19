/**
 * Available palettes preset paths
 */
export const PALETTE_PRESETS_PATHS = {
  light: {
    material: 'igniteui-theming/sass/color/presets/light/material',
    fluent: 'igniteui-theming/sass/color/presets/light/fluent',
    bootstrap: 'igniteui-theming/sass/color/presets/light/bootstrap',
    indigo: 'igniteui-theming/sass/color/presets/light/indigo',
  },
  dark: {
    material: 'igniteui-theming/sass/color/presets/dark/material',
    fluent: 'igniteui-theming/sass/color/presets/dark/fluent',
    bootstrap: 'igniteui-theming/sass/color/presets/dark/bootstrap',
    indigo: 'igniteui-theming/sass/color/presets/dark/indigo',
  },
} as const;


/**
 * Available typography preset paths
 */
export const TYPOGRAPHY_PRESETS_PATHS = {
  material: 'igniteui-theming/sass/typography/presets/material',
  fluent: 'igniteui-theming/sass/typography/presets/fluent',
  bootstrap: 'igniteui-theming/sass/typography/presets/bootstrap',
  indigo: 'igniteui-theming/sass/typography/presets/indigo',
} as const;

/**
 * Available schema presets
 */
export const SCHEMAS = {
  light: {
    material: '$light-material-schema',
    fluent: '$light-fluent-schema',
    bootstrap: '$light-bootstrap-schema',
    indigo: '$light-indigo-schema',
  },
  dark: {
    material: '$dark-material-schema',
    fluent: '$dark-fluent-schema',
    bootstrap: '$dark-bootstrap-schema',
    indigo: '$dark-indigo-schema',
  },
} as const;

/**
 * Available palettes presets
 */
export const PALETTES = {
  light: {
    material: '$light-material-palette',
    fluent: '$light-fluent-palette',
    bootstrap: '$light-bootstrap-palette',
    indigo: '$light-indigo-palette',
  },
  dark: {
    material: '$dark-material-palette',
    fluent: '$dark-fluent-palette',
    bootstrap: '$dark-bootstrap-palette',
    indigo: '$dark-indigo-palette',
  },
} as const;

/**
 * Available typefaces
 */
export const TYPEFACES = {
  material: '$material-typeface',
  fluent: '$fluent-typeface',
  bootstrap: '$bootstrap-typeface',
  indigo: '$indigo-typeface',
} as const;

/**
 * Available type scales
 */
export const TYPE_SCALES = {
  material: '$material-type-scale',
  fluent: '$fluent-type-scale',
  bootstrap: '$bootstrap-type-scale',
  indigo: '$indigo-type-scale',
} as const;

/**
 * Available elevation presets
 */
export const ELEVATIONS = {
  material: '$material-elevations',
  bootstrap: '$material-elevations',
  fluent: '$material-elevations',
  indigo: '$indigo-elevations',
} as const;
