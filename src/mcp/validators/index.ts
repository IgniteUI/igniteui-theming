/**
 * Validators index - re-exports all validation utilities.
 */

// Re-export common validation types from result.ts
export {
	combineValidationResults,
	formatValidationMessages,
	type ValidationError,
	type ValidationResult,
	type ValidationSeverity,
	type ValidationWarning,
	validationFailure,
	validationSuccess,
} from "../utils/result.js";
// Custom palette validation
export {
	type CustomPaletteError,
	type CustomPaletteValidationResult,
	type CustomPaletteWarning,
	formatCustomPaletteValidation,
	validateCustomPalette,
} from "./custom-palette.js";
// Palette validation
export {
	analyzeThemeColorsForPalette,
	formatPaletteSuitabilityWarnings,
	formatValidationResult,
	generatePaletteSuitabilityComments,
	generateWarningComments,
	type PaletteValidationMetadata,
	type PaletteValidationResult,
	type PaletteWarning,
	type ThemeColorsSuitabilityResult,
	type ValidatePaletteColorsInput,
	validatePaletteColors,
	type WarningSeverity,
} from "./palette.js";
