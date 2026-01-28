/**
 * Component selectors knowledge base.
 * Maps component names to their platform-specific CSS selectors,
 * defines component variants, and compound component relationships.
 */

import type {Platform} from './platforms/index.js';

/**
 * Platform-specific selectors for a component.
 * Use `null` to indicate a component is not available on a platform.
 */
export interface ComponentSelectors {
  /** Angular selector(s) - can be single string, array, or null if not available on Angular */
  angular: string | string[] | null;
  /** Web Components selector(s) - can be single string, array, or null if not available on Web Components */
  webcomponents: string | string[] | null;
}

/**
 * Platform-specific inner selectors for targeting related themes within a compound component.
 * These ensure themes are scoped to the compound component context, not applied globally.
 */
export interface CompoundInnerSelectors {
  /**
   * Angular scoped selectors for styling related themes within this compound component.
   * Maps related theme name to the scoped selector (e.g., 'igx-combo igx-checkbox').
   * Use 'TODO' as placeholder for selectors that need to be filled in.
   */
  angular: Record<string, string>;
  /**
   * Web Components ::part() selectors for styling related themes within this compound component.
   * Maps related theme name to the full selector including ::part().
   * Example: { 'drop-down': 'igc-combo::part(list)' }
   * Use 'TODO' as placeholder for selectors that need to be filled in.
   */
  webcomponents: Record<string, string>;
}

/**
 * Information about a compound component (one that contains multiple themeable sub-components).
 */
export interface CompoundComponentInfo {
  /** Description of what the compound component contains */
  description: string;
  /** Related theme functions needed for full customization */
  relatedThemes: string[];
  /**
   * Platform-specific inner selectors for targeting related themes within this compound component.
   * These ensure themes are scoped to the compound component context, not applied globally.
   */
  innerSelectors?: CompoundInnerSelectors;
}

/**
 * CSS selectors for each component by platform.
 * Used to scope component themes to specific elements.
 */
export const COMPONENT_SELECTORS: Record<string, ComponentSelectors> = {
  // Basic components
  'action-strip': {
    angular: 'igx-action-strip',
    webcomponents: null,
  },
  avatar: {
    angular: 'igx-avatar',
    webcomponents: 'igc-avatar',
  },
  badge: {
    angular: 'igx-badge',
    webcomponents: 'igc-badge',
  },
  banner: {
    angular: '.igx-banner',
    webcomponents: 'igc-banner',
  },
  'bottom-nav': {
    angular: 'igx-bottom-nav',
    webcomponents: 'igc-bottom-nav',
  },
  button: {
    angular: '.igx-button',
    webcomponents: 'igc-button',
  },
  'flat-button': {
    angular: '.igx-button--flat',
    webcomponents: 'igc-button[variant="flat"]',
  },
  'contained-button': {
    angular: ['.igx-button--contained'],
    webcomponents: 'igc-button[variant="contained"]',
  },
  'outlined-button': {
    angular: ['.igx-button--outlined'],
    webcomponents: 'igc-button[variant="outlined"]',
  },
  'fab-button': {
    angular: ['.igx-button--fab'],
    webcomponents: 'igc-button[variant="fab"]',
  },
  'icon-button': {
    angular: ['.igx-icon-button'],
    webcomponents: 'igc-icon-button',
  },
  'flat-icon-button': {
    angular: ['.igx-icon-button--flat'],
    webcomponents: 'igc-icon-button[variant="flat"]',
  },
  'contained-icon-button': {
    angular: ['.igx-icon-button--contained'],
    webcomponents: 'igc-icon-button[variant="contained"]',
  },
  'outlined-icon-button': {
    angular: ['.igx-icon-button--outlined'],
    webcomponents: 'igc-icon-button[variant="outlined"]',
  },
  'button-group': {
    angular: 'igx-buttongroup',
    webcomponents: 'igc-button-group',
  },
  calendar: {
    angular: 'igx-calendar',
    webcomponents: 'igc-calendar',
  },
  card: {
    angular: 'igx-card',
    webcomponents: 'igc-card',
  },
  carousel: {
    angular: 'igx-carousel',
    webcomponents: 'igc-carousel',
  },
  chat: {
    angular: 'igx-chat',
    webcomponents: 'igc-chat',
  },
  checkbox: {
    angular: 'igx-checkbox',
    webcomponents: 'igc-checkbox',
  },
  chip: {
    angular: 'igx-chip',
    webcomponents: 'igc-chip',
  },
  'column-actions': {
    angular: 'igx-column-actions',
    webcomponents: null,
  },
  combo: {
    angular: 'igx-combo',
    webcomponents: 'igc-combo',
  },
  'date-picker': {
    angular: 'igx-date-picker',
    webcomponents: 'igc-date-picker',
  },
  'date-range-picker': {
    angular: 'igx-date-range-picker',
    webcomponents: 'igc-date-range-picker',
  },
  // TODO: this component uses the input-group theme, but has no dedicated theme function
  'date-time-input': {
    angular: null,
    webcomponents: 'igc-date-time-input',
  },
  dialog: {
    angular: 'igx-dialog',
    webcomponents: 'igc-dialog',
  },
  divider: {
    angular: 'igx-divider',
    webcomponents: null,
  },
  'dock-manager': {
    angular: 'igc-dockmanager',
    webcomponents: 'igc-dockmanager',
  },
  'drop-down': {
    angular: '.igx-drop-down__list',
    webcomponents: 'igc-dropdown',
  },
  'expansion-panel': {
    angular: 'igx-expansion-panel',
    webcomponents: 'igc-expansion-panel',
  },
  'file-input': {
    angular: 'igx-input-group[class~="igx-input-group--file"]',
    webcomponents: 'igc-file-input',
  },
  grid: {
    angular: ['igx-grid', 'igx-tree-grid', 'igx-hierarchical-grid', 'igx-pivot-grid'],
    webcomponents: ['igc-grid', 'igc-tree-grid', 'igc-hierarchical-grid', 'igc-pivot-grid'],
  },
  'grid-summary': {
    angular: 'igx-grid-summary',
    webcomponents: 'igc-grid-summary',
  },
  'grid-toolbar': {
    angular: 'igx-grid-toolbar',
    webcomponents: 'igc-grid-toolbar',
  },
  highlight: {
    angular: 'igx-highlight',
    webcomponents: 'igc-highlight',
  },
  icon: {
    angular: 'igx-icon',
    webcomponents: 'igc-icon',
  },
  'input-group': {
    angular: 'igx-input-group',
    webcomponents: 'igc-input',
  },
  label: {
    angular: '[igxLabel]',
    webcomponents: 'igc-label',
  },
  list: {
    angular: 'igx-list',
    webcomponents: 'igc-list',
  },
  navbar: {
    angular: 'igx-navbar',
    webcomponents: 'igc-navbar',
  },
  navdrawer: {
    angular: 'igx-nav-drawer',
    webcomponents: 'igc-nav-drawer',
  },
  overlay: {
    angular: '.igx-overlay__content',
    webcomponents: null,
  },
  paginator: {
    angular: 'igx-paginator',
    webcomponents: 'igc-paginator',
  },
  'pivot-data-selector': {
    angular: 'igx-pivot-data-selector',
    webcomponents: 'igc-pivot-data-selector',
  },
  'progress-circular': {
    angular: 'igx-circular-bar',
    webcomponents: 'igc-circular-progress',
  },
  'progress-linear': {
    angular: 'igx-linear-bar',
    webcomponents: 'igc-linear-progress',
  },
  'query-builder': {
    angular: 'igx-query-builder',
    webcomponents: null,
  },
  radio: {
    angular: 'igx-radio',
    webcomponents: 'igc-radio',
  },
  rating: {
    angular: 'igx-rating',
    webcomponents: 'igc-rating',
  },
  ripple: {
    angular: 'igx-ripple',
    webcomponents: 'igc-ripple',
  },
  scrollbar: {
    angular: '.ig-scrollbar',
    webcomponents: '.ig-scrollbar',
  },
  select: {
    angular: 'igx-select',
    webcomponents: 'igc-select',
  },
  slider: {
    angular: 'igx-slider',
    webcomponents: 'igc-slider',
  },
  snackbar: {
    angular: 'igx-snackbar',
    webcomponents: 'igc-snackbar',
  },
  splitter: {
    angular: 'igx-splitter',
    webcomponents: 'igc-splitter',
  },
  stepper: {
    angular: 'igx-stepper',
    webcomponents: 'igc-stepper',
  },
  switch: {
    angular: 'igx-switch',
    webcomponents: 'igc-switch',
  },
  tabs: {
    angular: 'igx-tabs',
    webcomponents: 'igc-tabs',
  },
  'time-picker': {
    angular: 'igx-time-picker',
    webcomponents: 'igc-date-time-input',
  },
  toast: {
    angular: 'igx-toast',
    webcomponents: 'igc-toast',
  },
  tooltip: {
    angular: 'igx-tooltip',
    webcomponents: 'igc-tooltip',
  },
  tree: {
    angular: 'igx-tree',
    webcomponents: 'igc-tree',
  },
  watermark: {
    angular: 'igc-trial-watermark',
    webcomponents: 'igc-trial-watermark',
  },
};

/**
 * Components that have variant-specific theme functions.
 * Maps the base component to its themed variants.
 */
export const COMPONENT_VARIANTS: Record<string, string[]> = {
  button: ['flat-button', 'contained-button', 'outlined-button', 'fab-button'],
  'icon-button': ['flat-icon-button', 'contained-icon-button', 'outlined-icon-button'],
};

/**
 * List of variant theme names (for quick lookup).
 */
export const VARIANT_THEME_NAMES = new Set(Object.values(COMPONENT_VARIANTS).flat());

/**
 * Compound components that require theming multiple sub-components for full customization.
 */
export const COMPOUND_COMPONENTS: Record<string, CompoundComponentInfo> = {
  combo: {
    description:
      'The combo component uses an input-group for the input field, a drop-down for the selection list, and checkboxes for showing selected items.',
    relatedThemes: ['input-group', 'drop-down', 'checkbox'],
    innerSelectors: {
      angular: {
        'input-group': 'igx-combo igx-input-group',
        'drop-down': '.igx-drop-down__list',
        checkbox: 'igx-combo-item igx-checkbox',
      },
      webcomponents: {
        'input-group': 'igc-combo::part(input)',
        'drop-down': 'igc-combo::part(list-wrapper)',
        checkbox: 'igc-combo::part(checkbox)',
      },
    },
  },
  select: {
    description: 'The select component uses an input-group for the display and a drop-down for the options list.',
    relatedThemes: ['input-group', 'drop-down'],
    innerSelectors: {
      angular: {
        'input-group': 'igx-select igx-input-group',
        'drop-down': '.igx-drop-down__list',
      },
      webcomponents: {
        'input-group': 'igc-select::part(input)',
        'drop-down': 'igc-select',
      },
    },
  },
  'date-picker': {
    description: 'The date picker combines input-group and calendar components.',
    relatedThemes: ['input-group', 'calendar'],
    innerSelectors: {
      angular: {
        'input-group': 'igx-date-picker igx-input-group',
        calendar: 'igx-date-picker igx-calendar',
      },
      webcomponents: {
        'input-group': 'igc-date-picker::part(input)',
        calendar: 'igc-date-picker igc-calendar',
      },
    },
  },
  'date-range-picker': {
    description: 'The date range picker combines input-group and calendar components.',
    relatedThemes: ['input-group', 'calendar'],
    innerSelectors: {
      angular: {
        'input-group': 'igx-date-range-picker igx-date-range-start, igx-date-picker igx-date-range-end',
        calendar: 'igx-date-range-picker igx-calendar',
      },
      webcomponents: {
        'input-group': 'igc-date-range-picker::part(input)',
        calendar: 'igc-date-range-picker igc-calendar',
      },
    },
  },
  'time-picker': {
    description: 'The time picker uses input-group internally.',
    relatedThemes: ['input-group'],
    innerSelectors: {
      angular: {
        'input-group': 'igx-time-picker igx-input-group',
      },
      webcomponents: {
        'input-group': 'igc-date-time-input',
      },
    },
  },
  grid: {
    description:
      'The grid is a complex compound component with many themeable parts including filtering, editing, and selection.',
    relatedThemes: [
      'action-strip',
      'checkbox',
      'chip',
      'input-group',
      'drop-down',
      'flat-button',
      'outlined-button',
      'contained-button',
      'fab-button',
      'icon-button',
      'calendar',
      'snackbar',
      'paginator',
      'grid-summary',
      'grid-toolbar',
    ],
    innerSelectors: {
      angular: {
        'action-strip': 'igx-grid igx-action-strip',
        checkbox: 'igx-grid igx-checkbox',
        chip: 'igx-grid igx-chip',
        'input-group': 'igx-grid igx-input-group',
        'drop-down': 'igx-grid .igx-drop-down',
        'flat-button': 'igx-grid .igx-button--flat',
        'outlined-button': 'igx-grid .igx-button--outlined',
        'contained-button': 'igx-grid .igx-button--contained',
        'fab-button': 'igx-grid .igx-button--fab',
        'icon-button': 'igx-grid .igx-icon-button',
        calendar: 'igx-grid igx-calendar',
        snackbar: 'igx-grid igx-snackbar',
        paginator: 'igx-grid igx-paginator',
        'grid-summary': 'igx-grid igx-grid-summary-cell',
        'grid-toolbar': 'igx-grid igx-grid-toolbar',
      },
      webcomponents: {
        'action-strip': 'TODO',
        checkbox: 'TODO',
        chip: 'TODO',
        'input-group': 'TODO',
        'drop-down': 'TODO',
        'flat-button': 'TODO',
        'outlined-button': 'TODO',
        'contained-button': 'TODO',
        'fab-button': 'TODO',
        'icon-button': 'TODO',
        calendar: 'TODO',
        snackbar: 'TODO',
        paginator: 'TODO',
        'grid-summary': 'TODO',
        'grid-toolbar': 'TODO',
      },
    },
  },
  'query-builder': {
    description:
      'The query builder uses inputs, dropdowns, chips, and buttons, and button-groups for building query expressions.',
    // TODO: 'button' and 'icon-button' are base variants - need to determine which specific variants
    // (flat-button, outlined-button, etc.) are actually used and update relatedThemes accordingly
    relatedThemes: ['input-group', 'drop-down', 'chip', 'button', 'button-group', 'icon-button'],
    innerSelectors: {
      angular: {
        'input-group': 'igx-query-builder igx-input-group',
        'drop-down': 'igx-query-builder .igx-drop-down',
        chip: 'igx-query-builder igx-chip',
        button: 'igx-query-builder .igx-button',
        'button-group': 'igx-query-builder igx-buttongroup',
        'icon-button': 'igx-query-builder .igx-icon-button',
      },
      webcomponents: {
        'input-group': 'TODO',
        'drop-down': 'TODO',
        chip: 'TODO',
        button: 'TODO',
        'button-group': 'TODO',
        'icon-button': 'TODO',
      },
    },
  },
  'pivot-data-selector': {
    description: 'The pivot data selector uses checkboxes, expansion panels, lists, and chips.',
    relatedThemes: ['checkbox', 'expansion-panel', 'chip', 'list'],
    innerSelectors: {
      angular: {
        checkbox: 'igx-pivot-data-selector igx-checkbox',
        'expansion-panel': 'igx-pivot-data-selector igx-expansion-panel',
        chip: 'igx-pivot-data-selector igx-chip',
        list: 'igx-pivot-data-selector igx-list',
      },
      webcomponents: {
        checkbox: 'TODO',
        'expansion-panel': 'TODO',
        chip: 'TODO',
        list: 'TODO',
      },
    },
  },
};

/**
 * Get the selector(s) for a component on a specific platform.
 * @param componentName - The component name
 * @param platform - The target platform
 * @returns Array of selectors (normalized to always return array), empty array if component not found or not available on platform
 */
export function getComponentSelector(componentName: string, platform: Platform): string[] {
  const selectors = COMPONENT_SELECTORS[componentName];
  if (!selectors) {
    return [];
  }

  const platformSelectors = platform === 'angular' ? selectors.angular : selectors.webcomponents;

  // Return empty array if component is not available on this platform
  if (platformSelectors === null) {
    return [];
  }

  return Array.isArray(platformSelectors) ? platformSelectors : [platformSelectors];
}

/**
 * Check if a component is available on a specific platform.
 * @param componentName - The component name
 * @param platform - The target platform ('angular' or 'webcomponents')
 * @returns True if the component is available on the platform, false otherwise
 */
export function isComponentAvailable(componentName: string, platform: Platform): boolean {
  const selectors = COMPONENT_SELECTORS[componentName];
  if (!selectors) {
    return false;
  }

  const platformSelector = platform === 'angular' ? selectors.angular : selectors.webcomponents;
  return platformSelector !== null;
}

/**
 * Get all component names available on a specific platform.
 * @param platform - The target platform ('angular' or 'webcomponents')
 * @returns Array of component names available on the platform
 */
export function getComponentsForPlatform(platform: Platform): string[] {
  return Object.entries(COMPONENT_SELECTORS)
    .filter(([, selectors]) => {
      const platformSelector = platform === 'angular' ? selectors.angular : selectors.webcomponents;
      return platformSelector !== null;
    })
    .map(([name]) => name);
}

/**
 * Get platform availability for a component.
 * @param componentName - The component name
 * @returns Object indicating availability on each platform, or undefined if component not found
 */
export function getComponentPlatformAvailability(
  componentName: string,
): {angular: boolean; webcomponents: boolean} | undefined {
  const selectors = COMPONENT_SELECTORS[componentName];
  if (!selectors) {
    return undefined;
  }

  return {
    angular: selectors.angular !== null,
    webcomponents: selectors.webcomponents !== null,
  };
}

/**
 * Check if a component has variants.
 * @param componentName - The component name (e.g., 'button')
 * @returns True if the component has variant-specific themes
 */
export function hasVariants(componentName: string): boolean {
  return componentName in COMPONENT_VARIANTS;
}

/**
 * Get variants for a component.
 * @param componentName - The component name (e.g., 'button')
 * @returns Array of variant names or empty array
 */
export function getVariants(componentName: string): string[] {
  return COMPONENT_VARIANTS[componentName] ?? [];
}

/**
 * Check if a component name is a variant theme.
 * @param themeName - The theme name to check
 * @returns True if this is a variant theme (e.g., 'flat-button')
 */
export function isVariantTheme(themeName: string): boolean {
  return VARIANT_THEME_NAMES.has(themeName);
}

/**
 * Get compound component info if applicable.
 * @param componentName - The component name
 * @returns Compound info or undefined
 */
export function getCompoundComponentInfo(componentName: string): CompoundComponentInfo | undefined {
  return COMPOUND_COMPONENTS[componentName];
}

/**
 * Check if a component is a compound component.
 * @param componentName - The component name
 * @returns True if this is a compound component
 */
export function isCompoundComponent(componentName: string): boolean {
  return componentName in COMPOUND_COMPONENTS;
}

/**
 * Get the Web Components ::part() selector for a related theme within a compound component.
 * @param compoundComponent - The compound component name (e.g., 'combo')
 * @param relatedTheme - The related theme name (e.g., 'drop-down')
 * @returns The ::part() selector string, or undefined if not found/not applicable/still TODO
 */
export function getPartSelector(compoundComponent: string, relatedTheme: string): string | undefined {
  const info = COMPOUND_COMPONENTS[compoundComponent];

  if (!info?.innerSelectors?.webcomponents) {
    return undefined;
  }

  const selector = info.innerSelectors.webcomponents[relatedTheme];
  // Return undefined for TODO placeholders
  if (!selector || selector === 'TODO') {
    return undefined;
  }

  return selector;
}

/**
 * Get the Angular scoped selector for a related theme within a compound component.
 * @param compoundComponent - The compound component name (e.g., 'combo')
 * @param relatedTheme - The related theme name (e.g., 'checkbox')
 * @returns The scoped selector string (e.g., 'igx-combo igx-checkbox'), or undefined if not found/still TODO
 */
export function getAngularInnerSelector(compoundComponent: string, relatedTheme: string): string | undefined {
  const info = COMPOUND_COMPONENTS[compoundComponent];

  if (!info?.innerSelectors?.angular) {
    return undefined;
  }

  const selector = info.innerSelectors.angular[relatedTheme];
  // Return undefined for TODO placeholders
  if (!selector || selector === 'TODO') {
    return undefined;
  }

  return selector;
}

/**
 * Get the inner selector for a related theme within a compound component for a specific platform.
 * @param compoundComponent - The compound component name (e.g., 'combo')
 * @param relatedTheme - The related theme name (e.g., 'checkbox')
 * @param platform - The target platform ('angular' or 'webcomponents')
 * @returns The selector string, or undefined if not found/still TODO
 */
export function getInnerSelector(
  compoundComponent: string,
  relatedTheme: string,
  platform: Platform,
): string | undefined {
  return platform === 'angular'
    ? getAngularInnerSelector(compoundComponent, relatedTheme)
    : getPartSelector(compoundComponent, relatedTheme);
}

/**
 * Check if a compound component has Web Components part selectors defined (non-TODO values).
 * @param compoundComponent - The compound component name
 * @returns True if innerSelectors.webcomponents is defined and has at least one non-TODO value
 */
export function hasPartSelectors(compoundComponent: string): boolean {
  const info = COMPOUND_COMPONENTS[compoundComponent];

  if (!info?.innerSelectors?.webcomponents) {
    return false;
  }

  return Object.values(info.innerSelectors.webcomponents).some((v) => v !== 'TODO');
}

/**
 * Check if a compound component has Angular inner selectors defined (non-TODO values).
 * @param compoundComponent - The compound component name
 * @returns True if innerSelectors.angular is defined and has at least one non-TODO value
 */
export function hasAngularInnerSelectors(compoundComponent: string): boolean {
  const info = COMPOUND_COMPONENTS[compoundComponent];

  if (!info?.innerSelectors?.angular) {
    return false;
  }

  return Object.values(info.innerSelectors.angular).some((v) => v !== 'TODO');
}

/**
 * Check if a compound component has inner selectors defined for a specific platform.
 * @param compoundComponent - The compound component name
 * @param platform - The target platform ('angular' or 'webcomponents')
 * @returns True if inner selectors are defined and has at least one non-TODO value
 */
export function hasInnerSelectors(compoundComponent: string, platform: Platform): boolean {
  return platform === 'angular' ? hasAngularInnerSelectors(compoundComponent) : hasPartSelectors(compoundComponent);
}

/**
 * Get all Web Components part selectors for a compound component.
 * @param compoundComponent - The compound component name
 * @returns Record of related theme to selector, or undefined if not a compound component
 */
export function getAllPartSelectors(compoundComponent: string): Record<string, string> | undefined {
  const info = COMPOUND_COMPONENTS[compoundComponent];

  if (!info?.innerSelectors?.webcomponents) {
    return undefined;
  }

  return info.innerSelectors.webcomponents;
}

/**
 * Get all Angular inner selectors for a compound component.
 * @param compoundComponent - The compound component name
 * @returns Record of related theme to selector, or undefined if not a compound component
 */
export function getAllAngularInnerSelectors(compoundComponent: string): Record<string, string> | undefined {
  const info = COMPOUND_COMPONENTS[compoundComponent];

  if (!info?.innerSelectors?.angular) {
    return undefined;
  }

  return info.innerSelectors.angular;
}

/**
 * Get all inner selectors for a compound component for a specific platform.
 * @param compoundComponent - The compound component name
 * @param platform - The target platform ('angular' or 'webcomponents')
 * @returns Record of related theme to selector, or undefined if not a compound component
 */
export function getAllInnerSelectors(
  compoundComponent: string,
  platform: Platform,
): Record<string, string> | undefined {
  return platform === 'angular'
    ? getAllAngularInnerSelectors(compoundComponent)
    : getAllPartSelectors(compoundComponent);
}
