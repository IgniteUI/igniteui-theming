/**
 * Validation for custom palette structures.
 *
 * Uses the unified ValidationResult type from result.ts for consistent
 * error/warning handling across the codebase.
 *
 * Performance optimization: Uses batch color validation to minimize Sass
 * compilations. Instead of validating each color individually (which would
 * spawn ~100+ Sass processes), we collect all colors and validate them in
 * a single Sass compilation.
 */

import { SHADE_LEVELS } from "../knowledge/index.js";
import {
	analyzeColorsWithHue,
	DEFAULT_HUE_TOLERANCE,
	huesAreClose,
	validateColorsInBatch,
} from "../utils/color.js";
import {
	formatValidationMessages,
	type ValidationError,
	type ValidationResult,
	type ValidationWarning,
} from "../utils/result.js";
import {
	ALL_COLOR_SHADES,
	CHROMATIC_COLOR_GROUPS,
	type ColorDefinition,
	type CreateCustomPaletteInput,
	type GrayDefinition,
	type ThemeVariant,
} from "../utils/types.js";

/**
 * Result of custom palette validation.
 * Uses the standard ValidationResult interface.
 */
export type CustomPaletteValidationResult = ValidationResult;

// Re-export types for external use
export type {
	ValidationError as CustomPaletteError,
	ValidationWarning as CustomPaletteWarning,
};

/**
 * Helper to create a field path from color group and optional shade.
 */
function makeFieldPath(colorGroup: string, shade?: string): string {
	return shade ? `${colorGroup}.${shade}` : colorGroup;
}

/**
 * Collected color for batch validation.
 */
interface CollectedColor {
	key: string;
	color: string;
	groupName: string;
	shade?: string;
	isContrast?: boolean;
}

/**
 * Collects all colors from a palette input for batch validation.
 */
function collectAllColors(input: CreateCustomPaletteInput): {
	colors: CollectedColor[];
	missingShades: ValidationError[];
} {
	const colors: CollectedColor[] = [];
	const missingShades: ValidationError[] = [];

	// Collect chromatic colors
	for (const group of CHROMATIC_COLOR_GROUPS) {
		const definition = input[group];
		if (definition) {
			collectFromDefinition(
				group,
				definition,
				ALL_COLOR_SHADES,
				colors,
				missingShades,
			);
		}
	}

	// Collect gray colors
	if (input.gray) {
		collectFromDefinition(
			"gray",
			input.gray,
			[...SHADE_LEVELS],
			colors,
			missingShades,
		);
	}

	return { colors, missingShades };
}

/**
 * Collects colors from a single color definition.
 */
function collectFromDefinition(
	groupName: string,
	definition: ColorDefinition | GrayDefinition,
	expectedShades: readonly string[],
	colors: CollectedColor[],
	missingShades: ValidationError[],
): void {
	if (definition.mode === "shades") {
		// Collect base color
		colors.push({
			key: `${groupName}.baseColor`,
			color: definition.baseColor,
			groupName,
		});
	} else {
		// Collect explicit shades
		for (const shade of expectedShades) {
			const color = definition.shades[shade as keyof typeof definition.shades];
			if (!color) {
				missingShades.push({
					field: makeFieldPath(groupName, shade),
					message: `Missing required shade: ${shade}`,
				});
			} else {
				colors.push({
					key: `${groupName}.${shade}`,
					color,
					groupName,
					shade,
				});
			}
		}

		// Collect contrast overrides
		if (definition.contrastOverrides) {
			for (const [shade, color] of Object.entries(
				definition.contrastOverrides,
			)) {
				// Check if the shade key is valid (will add error later if not)
				if (expectedShades.includes(shade)) {
					colors.push({
						key: `${groupName}.contrast.${shade}`,
						color,
						groupName,
						shade,
						isContrast: true,
					});
				}
			}
		}
	}
}

/**
 * Validates a custom palette input structure.
 *
 * @param input - The custom palette input to validate
 * @param variant - Theme variant for gray shade progression validation (defaults to 'light')
 */
export async function validateCustomPalette(
	input: CreateCustomPaletteInput,
	variant: ThemeVariant = "light",
): Promise<CustomPaletteValidationResult> {
	const errors: ValidationError[] = [];
	const warnings: ValidationWarning[] = [];

	// Phase 1: Collect all colors and check for missing shades
	const { colors, missingShades } = collectAllColors(input);
	errors.push(...missingShades);

	// Check for invalid contrast override keys (not part of expected shades)
	// Cast to string[] for includes() check since we're validating user input
	const chromaticShadeSet = ALL_COLOR_SHADES as readonly string[];
	const grayShadeSet = SHADE_LEVELS as readonly string[];

	for (const group of CHROMATIC_COLOR_GROUPS) {
		const definition = input[group];
		if (definition?.mode === "explicit" && definition.contrastOverrides) {
			for (const shade of Object.keys(definition.contrastOverrides)) {
				if (!chromaticShadeSet.includes(shade)) {
					errors.push({
						field: makeFieldPath(group, shade),
						message: `Invalid contrast override key: ${shade}. Valid keys are: ${ALL_COLOR_SHADES.join(", ")}`,
					});
				}
			}
		}
	}
	if (input.gray?.mode === "explicit" && input.gray.contrastOverrides) {
		for (const shade of Object.keys(input.gray.contrastOverrides)) {
			if (!grayShadeSet.includes(shade)) {
				errors.push({
					field: makeFieldPath("gray", shade),
					message: `Invalid contrast override key: ${shade}. Valid keys are: ${SHADE_LEVELS.join(", ")}`,
				});
			}
		}
	}

	// Phase 2: Batch validate all collected colors (single Sass compilation)
	if (colors.length > 0) {
		const colorMap: Record<string, string> = {};
		for (const c of colors) {
			colorMap[c.key] = c.color;
		}

		const validationResults = await validateColorsInBatch(colorMap);

		// Generate errors for invalid colors
		for (const c of colors) {
			if (!validationResults[c.key]) {
				if (c.isContrast) {
					errors.push({
						field: makeFieldPath(c.groupName, `contrast.${c.shade}`),
						message: `Invalid contrast color for shade ${c.shade}: ${c.color}`,
						currentValue: c.color,
					});
				} else if (c.shade) {
					errors.push({
						field: makeFieldPath(c.groupName, c.shade),
						message: `Invalid color value for shade ${c.shade}: ${c.color}`,
						currentValue: c.color,
					});
				} else {
					errors.push({
						field: c.groupName,
						message: `Invalid base color: ${c.color}`,
						currentValue: c.color,
					});
				}
			}
		}
	}

	// Phase 3: Validate shade progression and monochromatic hue (only for explicit shades)
	// These use analyzeColorsWithHue which already batches colors efficiently
	for (const group of CHROMATIC_COLOR_GROUPS) {
		const definition = input[group];
		if (definition?.mode === "explicit") {
			await validateShadeProgression(
				group,
				definition.shades,
				"chromatic",
				variant,
				warnings,
			);
			await validateMonochromaticHue(group, definition.shades, warnings);
		}
	}

	if (input.gray?.mode === "explicit") {
		await validateShadeProgression(
			"gray",
			input.gray.shades,
			"gray",
			variant,
			warnings,
		);
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Format validation result as markdown.
 *
 * This is a thin wrapper around formatValidationMessages for backward compatibility.
 * New code should use formatValidationMessages directly.
 */
export function formatCustomPaletteValidation(
	result: CustomPaletteValidationResult,
): string {
	if (result.isValid && result.warnings.length === 0) return "";
	return formatValidationMessages(result);
}

// ============================================================================
// Shade Progression and Monochromatic Validation
// ============================================================================

/**
 * Validates that shade progression follows expected luminance direction.
 *
 * - Chromatic colors: shade 50 should be lighter than shade 900 (always)
 * - Gray (light themes): shade 50 should be lighter than shade 900
 * - Gray (dark themes): shade 50 should be darker than shade 900 (inverted)
 *
 * Only checks endpoints (50 vs 900), not full progression.
 * Issues warnings, not errors.
 */
async function validateShadeProgression(
	groupName: string,
	shades: Record<string, string>,
	colorType: "chromatic" | "gray",
	variant: ThemeVariant,
	warnings: ValidationWarning[],
): Promise<void> {
	const shade50 = shades["50"];
	const shade900 = shades["900"];

	// Skip if shades are missing (will be caught by other validation)
	if (!shade50 || !shade900) {
		return;
	}

	try {
		const analysis = await analyzeColorsWithHue({
			shade50: shade50,
			shade900: shade900,
		});

		const lum50 = analysis.shade50?.luminance;
		const lum900 = analysis.shade900?.luminance;

		if (lum50 === undefined || lum900 === undefined) {
			return;
		}

		// Determine expected direction
		const isGrayDarkTheme = colorType === "gray" && variant === "dark";

		if (isGrayDarkTheme) {
			// Gray in dark themes: 50 should be darker (lower luminance) than 900
			if (lum50 >= lum900) {
				warnings.push({
					field: groupName,
					message:
						"For dark themes, gray shade 50 should be darker than shade 900 (inverted progression). " +
						`Found: 50 (luminance: ${lum50.toFixed(3)}) vs 900 (luminance: ${lum900.toFixed(3)}).`,
					severity: "warning",
				});
			}
		} else if (lum50 <= lum900) {
			// Chromatic or gray in light themes: 50 should be lighter (higher luminance) than 900
			const context =
				colorType === "gray" ? "For light themes, gray" : "Chromatic";

			warnings.push({
				field: groupName,
				message:
					`${context} shade 50 should be lighter than shade 900. ` +
					`Found: 50 (luminance: ${lum50.toFixed(3)}) vs 900 (luminance: ${lum900.toFixed(3)}).`,
				severity: "warning",
			});
		}
	} catch (_error) {
		// Color analysis failures are non-fatal - the color validity check will catch
		// truly invalid colors. This can happen with edge-case color formats that Sass
		// accepts but our analysis doesn't handle. Log for debugging if needed.
		if (process.env.DEBUG) {
		}
	}
}

/**
 * Validates that a chromatic color family is monochromatic (same hue family).
 *
 * Checks hues at shades 50, 500, and 900. Warns if hue variation exceeds tolerance.
 * Only applies to chromatic colors, not gray.
 */
async function validateMonochromaticHue(
	groupName: string,
	shades: Record<string, string>,
	warnings: ValidationWarning[],
	tolerance: number = DEFAULT_HUE_TOLERANCE,
): Promise<void> {
	const shade50 = shades["50"];
	const shade500 = shades["500"];
	const shade900 = shades["900"];

	// Skip if shades are missing
	if (!shade50 || !shade500 || !shade900) {
		return;
	}

	try {
		const analysis = await analyzeColorsWithHue({
			shade50: shade50,
			shade500: shade500,
			shade900: shade900,
		});

		const hue50 = analysis.shade50?.hue;
		const hue500 = analysis.shade500?.hue;
		const hue900 = analysis.shade900?.hue;

		if (hue50 === undefined || hue500 === undefined || hue900 === undefined) {
			return;
		}

		// Check if all hues are within tolerance of each other
		const hues = [
			{ shade: "50", hue: hue50 },
			{ shade: "500", hue: hue500 },
			{ shade: "900", hue: hue900 },
		];

		const outliers: string[] = [];

		// Compare each pair
		for (let i = 0; i < hues.length; i++) {
			for (let j = i + 1; j < hues.length; j++) {
				if (!huesAreClose(hues[i].hue, hues[j].hue, tolerance)) {
					outliers.push(
						`${hues[i].shade} (${Math.round(hues[i].hue)}°) vs ${hues[j].shade} (${Math.round(hues[j].hue)}°)`,
					);
				}
			}
		}

		if (outliers.length > 0) {
			warnings.push({
				field: groupName,
				message:
					`Color shades may not be monochromatic (hue varies by more than ±${tolerance}°). ` +
					`Differences found: ${outliers.join(", ")}. ` +
					"Consider using colors from the same hue family for visual consistency.",
				severity: "warning",
			});
		}
	} catch (_error) {
		// Color analysis failures are non-fatal - the color validity check will catch
		// truly invalid colors. This can happen with edge-case color formats that Sass
		// accepts but our analysis doesn't handle. Log for debugging if needed.
		if (process.env.DEBUG) {
		}
	}
}
