/**
 * Validators index - re-exports all validation utilities.
 */

// Re-export common validation types from result.ts
export {
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ValidationSeverity,
  validationSuccess,
  validationFailure,
  combineValidationResults,
  formatValidationMessages,
} from '../utils/result.js';

// Palette validation
export {
  validatePaletteColors,
  formatValidationResult,
  generateWarningComments,
  analyzeThemeColorsForPalette,
  formatPaletteSuitabilityWarnings,
  generatePaletteSuitabilityComments,
  type PaletteWarning,
  type PaletteValidationResult,
  type PaletteValidationMetadata,
  type ValidatePaletteColorsInput,
  type WarningSeverity,
  type ThemeColorsSuitabilityResult,
} from './palette.js';

// Custom palette validation
export {
  validateCustomPalette,
  formatCustomPaletteValidation,
  type CustomPaletteError,
  type CustomPaletteWarning,
  type CustomPaletteValidationResult,
} from './custom-palette.js';
