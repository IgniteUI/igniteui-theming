/**
 * Palette validation logic.
 * Validates surface and gray colors against the theme variant.
 *
 * Uses the unified ValidationResult type from result.ts while maintaining
 * specialized warning types for palette-specific validation.
 */

import {
  analyzeSurfaceGrayColors,
  type ColorAnalysis,
  DEFAULT_MINIMUM_CONTRAST_RATIO,
  LUMINANCE_THRESHOLD,
  SUGGESTED_COLORS,
  type SurfaceGrayAnalysis,
} from "../utils/color.js";
import {
  formatValidationMessages,
  type ValidationResult,
  type ValidationWarning,
} from "../utils/result.js";
import type { ThemeVariant } from "../utils/types.js";

// Re-export ValidationSeverity as WarningSeverity for backward compatibility
export type WarningSeverity = "warning" | "info";

/**
 * A palette validation warning.
 * Extends ValidationWarning with palette-specific fields.
 */
export interface PaletteWarning extends ValidationWarning {
  /** Which parameter the warning is about (mapped to field for compatibility) */
  field: "surface" | "gray" | "contrast";
}

/**
 * Metadata for palette validation results.
 */
export interface PaletteValidationMetadata {
  /** Raw analysis data from Sass */
  analysis: SurfaceGrayAnalysis;
}

/**
 * Result of palette color validation.
 * Uses ValidationResult with palette-specific metadata.
 */
export interface PaletteValidationResult
  extends ValidationResult<PaletteValidationMetadata> {
  /** Override warnings to use PaletteWarning type */
  warnings: PaletteWarning[];
  /** Raw analysis data (alias for metadata.analysis for backward compatibility) */
  analysis: SurfaceGrayAnalysis;
}

/**
 * Input parameters for palette validation.
 */
export interface ValidatePaletteColorsInput {
  /** Theme variant (light or dark) */
  variant: ThemeVariant;
  /** Surface/background color */
  surface?: string;
  /** Gray base color */
  gray?: string;
  /** Minimum contrast ratio (default: 3) */
  minimumContrastRatio?: number;
}

/**
 * Validate surface and gray colors against the theme variant.
 *
 * Rules:
 * - Light variant: surface should be light (luminance > 0.5), gray should be dark (luminance <= 0.5)
 * - Dark variant: surface should be dark (luminance <= 0.5), gray should be light (luminance > 0.5)
 *
 * The gray logic is inverted because the Sass palette() function generates gray shades
 * that contrast against the surface.
 *
 * @param input - Validation input parameters
 * @returns Validation result with warnings and tips
 */
export async function validatePaletteColors(
  input: ValidatePaletteColorsInput,
): Promise<PaletteValidationResult> {
  const {
    variant,
    surface,
    gray,
    minimumContrastRatio = DEFAULT_MINIMUM_CONTRAST_RATIO,
  } = input;

  const warnings: PaletteWarning[] = [];
  const tips: string[] = [];

  // If neither surface nor gray is provided, no validation needed
  if (!surface && !gray) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      tips: [],
      analysis: {},
      metadata: { analysis: {} },
    };
  }

  // Analyze colors using Sass
  let analysis: SurfaceGrayAnalysis;
  try {
    analysis = await analyzeSurfaceGrayColors({ surface, gray });
  } catch (error) {
    // If analysis fails, return with an error warning
    const message = error instanceof Error ? error.message : String(error);
    return {
      isValid: false,
      errors: [],
      warnings: [
        {
          field: "surface",
          severity: "warning",
          message: `Failed to analyze colors: ${message}`,
        },
      ],
      tips: [
        "Ensure color values are valid CSS colors (hex, rgb, hsl, or named colors)",
      ],
      analysis: {},
      metadata: { analysis: {} },
    };
  }

  // Validate surface color
  if (surface && analysis.surface) {
    const surfaceWarning = validateSurfaceColor(analysis.surface, variant);
    if (surfaceWarning) {
      warnings.push(surfaceWarning);
    }
  }

  // Validate gray color
  if (gray && analysis.gray) {
    const grayWarning = validateGrayColor(analysis.gray, variant);
    if (grayWarning) {
      warnings.push(grayWarning);
    }
  }

  // Check contrast ratio if both colors are provided
  if (surface && gray && analysis.contrastRatio !== undefined) {
    if (analysis.contrastRatio < minimumContrastRatio) {
      warnings.push({
        field: "contrast",
        severity: "warning",
        message: `Contrast ratio between surface and gray is ${analysis.contrastRatio.toFixed(2)}:1, which is below the recommended ${minimumContrastRatio}:1`,
        details: {
          contrastRatio: analysis.contrastRatio,
        },
      });
    }
  }

  // Add tips based on warnings
  if (warnings.some((w) => w.field === "gray")) {
    tips.push(
      "Consider omitting the gray parameter to let the palette() function auto-calculate an appropriate gray base from the surface color",
    );
  }

  if (warnings.some((w) => w.field === "surface")) {
    tips.push(
      `For a ${variant} theme, use a ${variant === "light" ? "light" : "dark"} surface color like ${SUGGESTED_COLORS[variant].surface.slice(0, 3).join(", ")}`,
    );
  }

  return {
    isValid: warnings.length === 0,
    errors: [],
    warnings,
    tips,
    analysis,
    metadata: { analysis },
  };
}

/**
 * Validate surface color against variant.
 */
function validateSurfaceColor(
  surface: ColorAnalysis,
  variant: ThemeVariant,
): PaletteWarning | null {
  // Light variant expects light surface (high luminance)
  // Dark variant expects dark surface (low luminance)
  const expectLight = variant === "light";
  const isCorrect = surface.isLight === expectLight;

  if (isCorrect) {
    return null;
  }

  const colorType = surface.isLight ? "light" : "dark";
  const expectedType = expectLight ? "light" : "dark";

  return {
    field: "surface",
    severity: "warning",
    message: `Surface color "${surface.color}" is a ${colorType} color (luminance: ${surface.luminance.toFixed(2)}), but variant is '${variant}'. Expected a ${expectedType} surface color (luminance ${expectLight ? `> ${LUMINANCE_THRESHOLD}` : `<= ${LUMINANCE_THRESHOLD}`}).`,
    currentValue: surface.color,
    suggestedValues: SUGGESTED_COLORS[variant].surface.slice(0, 3),
    details: {
      luminance: surface.luminance,
      isLight: surface.isLight,
      expectedLuminance: expectLight
        ? `> ${LUMINANCE_THRESHOLD}`
        : `<= ${LUMINANCE_THRESHOLD}`,
    },
  };
}

/**
 * Validate gray color against variant.
 *
 * Note: Gray logic is INVERTED from surface because the palette() function
 * generates gray shades that need to contrast with the surface.
 * - Light variant (light surface) needs dark gray base
 * - Dark variant (dark surface) needs light gray base
 */
function validateGrayColor(
  gray: ColorAnalysis,
  variant: ThemeVariant,
): PaletteWarning | null {
  // Gray is inverted: light variant needs dark gray, dark variant needs light gray
  const expectLightGray = variant === "dark";
  const isCorrect = gray.isLight === expectLightGray;

  if (isCorrect) {
    return null;
  }

  const colorType = gray.isLight ? "light" : "dark";
  const expectedType = expectLightGray ? "light" : "dark";

  return {
    field: "gray",
    severity: "warning",
    message: `Gray base "${gray.color}" is a ${colorType} color (luminance: ${gray.luminance.toFixed(2)}), but variant is '${variant}'. For ${variant} themes, the gray base should be ${expectedType} (luminance ${expectLightGray ? `> ${LUMINANCE_THRESHOLD}` : `<= ${LUMINANCE_THRESHOLD}`}) to ensure proper contrast with the ${variant} surface.`,
    currentValue: gray.color,
    suggestedValues: SUGGESTED_COLORS[variant].gray.slice(0, 3),
    details: {
      luminance: gray.luminance,
      isLight: gray.isLight,
      expectedLuminance: expectLightGray
        ? `> ${LUMINANCE_THRESHOLD}`
        : `<= ${LUMINANCE_THRESHOLD}`,
    },
  };
}

/**
 * Format validation result as markdown for display.
 *
 * @param result - Validation result to format
 * @returns Markdown string with warnings and tips
 */
export function formatValidationResult(
  result: PaletteValidationResult,
): string {
  if (result.isValid) {
    return "";
  }

  // Use the unified formatter
  return formatValidationMessages(result);
}

/**
 * Generate Sass comment warnings for code generation.
 *
 * @param result - Validation result
 * @returns Array of Sass comment lines
 */
export function generateWarningComments(
  result: PaletteValidationResult,
): string[] {
  if (result.isValid) {
    return [];
  }

  return result.warnings.map((warning) => {
    const paramLabel =
      warning.field === "contrast"
        ? "Contrast"
        : `${capitalize(warning.field)} color`;
    return `// ⚠️ Warning: ${paramLabel} may not be optimal for this variant`;
  });
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
