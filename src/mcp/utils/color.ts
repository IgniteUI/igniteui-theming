/**
 * Color analysis utilities using Sass-embedded.
 * Calls the actual Sass luminance() and contrast() functions for accurate validation.
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass-embedded";

// Get the package root directory (where sass/ folder is located)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// From dist/mcp/utils/ we need to go up 3 levels to package root
const PACKAGE_ROOT = path.resolve(__dirname, "..", "..", "..");

/**
 * Luminance threshold for determining light vs dark colors.
 * Colors with luminance > 0.5 are considered "light".
 * Colors with luminance <= 0.5 are considered "dark".
 */
export const LUMINANCE_THRESHOLD = 0.5;

/**
 * Minimum recommended contrast ratio for surface/gray combinations.
 * This is the WCAG 2.0 AA standard for large text (3:1).
 * Note: The actual contrast ratio can be configured via the palette mixin.
 */
export const DEFAULT_MINIMUM_CONTRAST_RATIO = 3;

/**
 * Result of analyzing a single color.
 */
export interface ColorAnalysis {
	/** The original color value */
	color: string;
	/** Calculated luminance (0-1) */
	luminance: number;
	/** Whether the color is considered light (luminance > 0.5) */
	isLight: boolean;
}

/**
 * Result of analyzing surface and gray colors together.
 */
export interface SurfaceGrayAnalysis {
	/** Analysis of the surface color */
	surface?: ColorAnalysis;
	/** Analysis of the gray color */
	gray?: ColorAnalysis;
	/** Contrast ratio between surface and gray (if both provided) */
	contrastRatio?: number;
}

/**
 * Suggested colors for different variants.
 */
export const SUGGESTED_COLORS = {
	light: {
		surface: ["white", "#ffffff", "#f8f9fa", "#fafafa", "#f5f5f5"],
		gray: ["black", "#000000", "#333333", "#212121", "#424242"],
	},
	dark: {
		surface: ["#222222", "#1a1a1a", "#121212", "#181818", "#2d2d2d"],
		gray: ["white", "#ffffff", "#e5e5e5", "#f5f5f5", "#eeeeee"],
	},
} as const;

/**
 * Analyze a single color using Sass luminance() function.
 *
 * @param color - CSS color value (hex, rgb, hsl, or named color)
 * @returns Color analysis with luminance and isLight flag
 * @throws Error if Sass compilation fails or color is invalid
 */
export async function analyzeColor(color: string): Promise<ColorAnalysis> {
	const sassCode = `
@use 'sass/color' as color;

$lum: color.luminance(${color});

:root {
  --luminance: #{$lum};
}
`;

	try {
		const result = await sass.compileStringAsync(sassCode, {
			loadPaths: [PACKAGE_ROOT],
		});

		// Parse the luminance value from CSS output
		const luminanceMatch = result.css.match(/--luminance:\s*([\d.]+)/);
		if (!luminanceMatch) {
			throw new Error(
				`Could not parse luminance from Sass output for color: ${color}`,
			);
		}

		const luminance = Number.parseFloat(luminanceMatch[1]);

		return {
			color,
			luminance,
			isLight: luminance > LUMINANCE_THRESHOLD,
		};
	} catch (error) {
		// Re-throw with more context
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to analyze color "${color}": ${message}`);
	}
}

/**
 * Calculate the contrast ratio between two colors using Sass contrast() function.
 *
 * @param color1 - First CSS color value
 * @param color2 - Second CSS color value
 * @returns Contrast ratio (1 to 21)
 * @throws Error if Sass compilation fails or colors are invalid
 */
export async function calculateContrast(
	color1: string,
	color2: string,
): Promise<number> {
	const sassCode = `
@use 'sass/color' as color;

$ratio: color.contrast(${color1}, ${color2});

:root {
  --contrast-ratio: #{$ratio};
}
`;

	try {
		const result = await sass.compileStringAsync(sassCode, {
			loadPaths: [PACKAGE_ROOT],
		});

		// Parse the contrast ratio from CSS output
		const contrastMatch = result.css.match(/--contrast-ratio:\s*([\d.]+)/);
		if (!contrastMatch) {
			throw new Error("Could not parse contrast ratio from Sass output");
		}

		return Number.parseFloat(contrastMatch[1]);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Failed to calculate contrast between "${color1}" and "${color2}": ${message}`,
		);
	}
}

/**
 * Analyze surface and gray colors together in a single Sass compilation.
 * This is more efficient than calling analyzeColor twice.
 *
 * @param params - Object containing surface and/or gray colors
 * @returns Combined analysis results
 */
export async function analyzeSurfaceGrayColors(params: {
	surface?: string;
	gray?: string;
}): Promise<SurfaceGrayAnalysis> {
	const { surface, gray } = params;

	// If neither color is provided, return empty result
	if (!surface && !gray) {
		return {};
	}

	// Build Sass code to analyze all provided colors in one compilation
	const sassLines = [`@use 'sass/color' as color;`, ""];

	if (surface) {
		sassLines.push(`$surface-lum: color.luminance(${surface});`);
	}
	if (gray) {
		sassLines.push(`$gray-lum: color.luminance(${gray});`);
	}
	if (surface && gray) {
		sassLines.push(`$contrast: color.contrast(${surface}, ${gray});`);
	}

	sassLines.push("", ":root {");
	if (surface) {
		sassLines.push("  --surface-luminance: #{$surface-lum};");
	}
	if (gray) {
		sassLines.push("  --gray-luminance: #{$gray-lum};");
	}
	if (surface && gray) {
		sassLines.push("  --contrast-ratio: #{$contrast};");
	}
	sassLines.push("}");

	const sassCode = sassLines.join("\n");

	try {
		const result = await sass.compileStringAsync(sassCode, {
			loadPaths: [PACKAGE_ROOT],
		});

		const analysis: SurfaceGrayAnalysis = {};

		if (surface) {
			const surfaceMatch = result.css.match(/--surface-luminance:\s*([\d.]+)/);
			if (surfaceMatch) {
				const luminance = Number.parseFloat(surfaceMatch[1]);
				analysis.surface = {
					color: surface,
					luminance,
					isLight: luminance > LUMINANCE_THRESHOLD,
				};
			}
		}

		if (gray) {
			const grayMatch = result.css.match(/--gray-luminance:\s*([\d.]+)/);
			if (grayMatch) {
				const luminance = Number.parseFloat(grayMatch[1]);
				analysis.gray = {
					color: gray,
					luminance,
					isLight: luminance > LUMINANCE_THRESHOLD,
				};
			}
		}

		if (surface && gray) {
			const contrastMatch = result.css.match(/--contrast-ratio:\s*([\d.]+)/);
			if (contrastMatch) {
				analysis.contrastRatio = Number.parseFloat(contrastMatch[1]);
			}
		}

		return analysis;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to analyze surface/gray colors: ${message}`);
	}
}

/**
 * Check if a color is valid by attempting to analyze it.
 *
 * @param color - CSS color value to validate
 * @returns true if the color is valid, false otherwise
 */
export async function isValidColor(color: string): Promise<boolean> {
	try {
		await analyzeColor(color);
		return true;
	} catch {
		return false;
	}
}

/**
 * Validate multiple colors in a single Sass compilation for efficiency.
 * This is much faster than calling isValidColor() for each color individually.
 *
 * @param colors - Map of key names to color values
 * @returns Map of key names to validation results (true = valid, false = invalid)
 */
export async function validateColorsInBatch(
	colors: Record<string, string>,
): Promise<Record<string, boolean>> {
	const entries = Object.entries(colors);
	if (entries.length === 0) {
		return {};
	}

	// Build Sass code that attempts to use each color
	// Invalid colors will cause Sass compilation errors, but we catch them per-color
	// by using a try/catch pattern in Sass itself (via color.is-color())
	const sassLines = [`@use 'sass:color';`, `@use 'sass:meta';`, ""];

	// For each color, we check if it's a valid color using meta.type-of()
	// A valid color will have type "color", invalid will cause an error or have different type
	for (const [key, colorValue] of entries) {
		const safeKey = key.replace(/[^a-zA-Z0-9]/g, "-");
		// Use a variable assignment to test if the color parses correctly
		// If it's not a valid color, Sass will error, but we can catch this
		sassLines.push(
			`$${safeKey}-valid: meta.type-of(${colorValue}) == 'color';`,
		);
	}

	sassLines.push("", ":root {");
	for (const [key] of entries) {
		const safeKey = key.replace(/[^a-zA-Z0-9]/g, "-");
		sassLines.push(`  --${safeKey}-valid: #{$${safeKey}-valid};`);
	}
	sassLines.push("}");

	const sassCode = sassLines.join("\n");

	try {
		const result = await sass.compileStringAsync(sassCode, {
			loadPaths: [PACKAGE_ROOT],
		});

		const validationResults: Record<string, boolean> = {};

		for (const [key] of entries) {
			const safeKey = key.replace(/[^a-zA-Z0-9]/g, "-");
			const validMatch = result.css.match(
				new RegExp(`--${safeKey}-valid:\\s*(true|false)`),
			);
			validationResults[key] = validMatch ? validMatch[1] === "true" : false;
		}

		return validationResults;
	} catch {
		// If the entire compilation fails, it means at least one color is invalid
		// Fall back to individual validation to identify which ones
		const validationResults: Record<string, boolean> = {};
		for (const [key, colorValue] of entries) {
			validationResults[key] = await isValidColor(colorValue);
		}
		return validationResults;
	}
}

/**
 * Default hue tolerance in degrees for monochromatic validation.
 * Allows for slight hue variation within a color family.
 */
export const DEFAULT_HUE_TOLERANCE = 30;

/**
 * Extract the hue value (0-360) from a color using Sass color.channel() function.
 *
 * @param color - CSS color value (hex, rgb, hsl, or named color)
 * @returns Hue value in degrees (0-360)
 * @throws Error if Sass compilation fails or color is invalid
 */
export async function extractHue(color: string): Promise<number> {
	const sassCode = `
@use 'sass:color';

$hue: color.channel(${color}, "hue", $space: hsl);

:root {
  --hue: #{$hue};
}
`;

	try {
		const result = await sass.compileStringAsync(sassCode, {
			loadPaths: [PACKAGE_ROOT],
		});

		// Parse the hue value from CSS output (e.g., "210deg" or "210")
		const hueMatch = result.css.match(/--hue:\s*([\d.]+)/);
		if (!hueMatch) {
			throw new Error(
				`Could not parse hue from Sass output for color: ${color}`,
			);
		}

		return Number.parseFloat(hueMatch[1]);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to extract hue from color "${color}": ${message}`);
	}
}

/**
 * Check if two hue values are within tolerance of each other,
 * accounting for the circular nature of hue (0° = 360°).
 *
 * @param hue1 - First hue value (0-360)
 * @param hue2 - Second hue value (0-360)
 * @param tolerance - Maximum allowed difference in degrees (default: 30)
 * @returns true if hues are within tolerance
 */
export function huesAreClose(
	hue1: number,
	hue2: number,
	tolerance: number = DEFAULT_HUE_TOLERANCE,
): boolean {
	// Calculate the minimum angular distance between two hues
	// accounting for the circular nature (e.g., 350° and 10° are 20° apart)
	const diff = Math.abs(hue1 - hue2);
	const circularDiff = Math.min(diff, 360 - diff);
	return circularDiff <= tolerance;
}

/**
 * Analyze multiple colors in a single Sass compilation for efficiency.
 * Returns luminance and hue for each color.
 *
 * @param colors - Map of key names to color values
 * @returns Map of key names to analysis results
 */
export async function analyzeColorsWithHue(
	colors: Record<string, string>,
): Promise<Record<string, { luminance: number; hue: number }>> {
	const entries = Object.entries(colors);
	if (entries.length === 0) {
		return {};
	}

	// Build Sass code to analyze all colors in one compilation
	const sassLines = [`@use 'sass/color' as igColor;`, `@use 'sass:color';`, ""];

	for (const [key, color] of entries) {
		const safeKey = key.replace(/[^a-zA-Z0-9]/g, "-");
		sassLines.push(`$${safeKey}-lum: igColor.luminance(${color});`);
		sassLines.push(
			`$${safeKey}-hue: color.channel(${color}, "hue", $space: hsl);`,
		);
	}

	sassLines.push("", ":root {");
	for (const [key] of entries) {
		const safeKey = key.replace(/[^a-zA-Z0-9]/g, "-");
		sassLines.push(`  --${safeKey}-luminance: #{$${safeKey}-lum};`);
		sassLines.push(`  --${safeKey}-hue: #{$${safeKey}-hue};`);
	}
	sassLines.push("}");

	const sassCode = sassLines.join("\n");

	try {
		const result = await sass.compileStringAsync(sassCode, {
			loadPaths: [PACKAGE_ROOT],
		});

		const analysis: Record<string, { luminance: number; hue: number }> = {};

		for (const [key] of entries) {
			const safeKey = key.replace(/[^a-zA-Z0-9]/g, "-");
			const lumMatch = result.css.match(
				new RegExp(`--${safeKey}-luminance:\\s*([\\d.]+)`),
			);
			const hueMatch = result.css.match(
				new RegExp(`--${safeKey}-hue:\\s*([\\d.]+)`),
			);

			if (lumMatch && hueMatch) {
				analysis[key] = {
					luminance: Number.parseFloat(lumMatch[1]),
					hue: Number.parseFloat(hueMatch[1]),
				};
			}
		}

		return analysis;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to analyze colors: ${message}`);
	}
}

// ============================================================================
// Palette Shade Generation Suitability
// ============================================================================

/**
 * Luminance thresholds for palette shade generation suitability.
 * Colors outside this range may produce poor automatic shade generation results.
 *
 * Note: This is different from LUMINANCE_THRESHOLD (0.5) which determines
 * if a color is "light" or "dark" for variant matching. These thresholds
 * determine if a color can produce a good range of shades when used with
 * the palette() function.
 *
 * Based on color theory research:
 * - Optimal base color tone: 35-65 L* (CIELAB)
 * - Too light (L* > 70-75): darker shades compress together
 * - Too dark (L* < 25-30): lighter shades compress together
 */
export const PALETTE_LUMINANCE_THRESHOLDS = {
	/** Below this luminance, lighter shades (50-200) will lack contrast range */
	TOO_DARK: 0.05,
	/** Above this luminance, darker shades (600-900) will appear washed out */
	TOO_LIGHT: 0.45,
} as const;

/**
 * Base fields for palette suitability analysis.
 */
interface PaletteSuitabilityBase {
	/** The original color value */
	color: string;
	/** Calculated luminance (0-1) */
	luminance: number;
}

/**
 * Result when a color is suitable for automatic shade generation.
 */
interface PaletteSuitabilitySuitable extends PaletteSuitabilityBase {
	/** The color is suitable for automatic shade generation */
	suitable: true;
}

/**
 * Result when a color is NOT suitable for automatic shade generation.
 */
interface PaletteSuitabilityUnsuitable extends PaletteSuitabilityBase {
	/** The color is not suitable for automatic shade generation */
	suitable: false;
	/** Issue type - always present when not suitable */
	issue: "too-light" | "too-dark";
	/** Human-readable description of the issue - always present when not suitable */
	description: string;
}

/**
 * Result of analyzing a color for palette shade generation suitability.
 * Uses a discriminated union: when `suitable` is false, `issue` and `description`
 * are guaranteed to be present.
 */
export type PaletteSuitabilityAnalysis =
	| PaletteSuitabilitySuitable
	| PaletteSuitabilityUnsuitable;

/**
 * Analyze whether a color is suitable for automatic shade generation.
 * Colors with extreme luminance (very light or very dark) may produce
 * poor results when using the palette() function's automatic shade generation.
 *
 * @param color - CSS color value (hex, rgb, hsl, or named color)
 * @returns Analysis result indicating suitability and any issues
 */
export async function analyzeColorForPalette(
	color: string,
): Promise<PaletteSuitabilityAnalysis> {
	const analysis = await analyzeColor(color);

	if (analysis.luminance > PALETTE_LUMINANCE_THRESHOLDS.TOO_LIGHT) {
		return {
			color,
			luminance: analysis.luminance,
			suitable: false,
			issue: "too-light",
			description:
				`Luminance ${analysis.luminance.toFixed(2)} exceeds ${PALETTE_LUMINANCE_THRESHOLDS.TOO_LIGHT} - ` +
				"darker shades (600-900) will appear washed out",
		};
	}

	if (analysis.luminance < PALETTE_LUMINANCE_THRESHOLDS.TOO_DARK) {
		return {
			color,
			luminance: analysis.luminance,
			suitable: false,
			issue: "too-dark",
			description:
				`Luminance ${analysis.luminance.toFixed(2)} is below ${PALETTE_LUMINANCE_THRESHOLDS.TOO_DARK} - ` +
				"lighter shades (50-200) will lack contrast range",
		};
	}

	return {
		color,
		luminance: analysis.luminance,
		suitable: true,
	};
}
