/**
 * Knowledge about custom palette creation for model guidance.
 */

import CUSTOM_PALETTE_GUIDANCE from "./docs/colors/custom-palettes.md?raw";
import { ACCENT_SHADE_LEVELS, SHADE_LEVELS } from "./multipliers.js";

export { CUSTOM_PALETTE_GUIDANCE };

/**
 * Required shade counts for validation.
 */
export const REQUIRED_SHADES = {
	/** Number of shades required for chromatic colors (primary, secondary, etc.) */
	chromatic: [...SHADE_LEVELS, ...ACCENT_SHADE_LEVELS].length, // 14
	/** Number of shades required for gray */
	gray: SHADE_LEVELS.length, // 10
};

/**
 * All chromatic shades combined.
 */
export const ALL_CHROMATIC_SHADES = [...SHADE_LEVELS, ...ACCENT_SHADE_LEVELS];

/**
 * All gray shades.
 */
export const ALL_GRAY_SHADES = [...SHADE_LEVELS];
