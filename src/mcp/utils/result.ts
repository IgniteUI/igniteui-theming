/**
 * Result Type for Error Handling
 *
 * This module provides a standardized Result type for operations that can fail.
 * Using a Result type instead of exceptions makes error handling explicit and
 * composable, following functional programming patterns.
 *
 * Use this pattern for:
 * - Operations that can fail due to external input (user input, file I/O, etc.)
 * - Validation that should return errors instead of throwing
 * - Operations where you want to accumulate multiple errors
 *
 * Use exceptions (throw) for:
 * - Programming errors (assertions, invalid state)
 * - Unrecoverable errors
 */

/**
 * A successful result containing a value.
 */
export interface Success<T> {
  readonly ok: true;
  readonly value: T;
}

/**
 * A failed result containing an error.
 */
export interface Failure<E> {
  readonly ok: false;
  readonly error: E;
}

/**
 * A Result is either a Success with a value or a Failure with an error.
 * This provides type-safe error handling without exceptions.
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Create a successful result.
 *
 * @example
 * const result = success({ code: '...', variables: ['$my-palette'] });
 */
export function success<T>(value: T): Success<T> {
  return {ok: true, value};
}

/**
 * Create a failed result.
 *
 * @example
 * const result = failure(new Error('Invalid color'));
 * const result = failure({ code: 'INVALID_COLOR', message: 'Invalid color' });
 */
export function failure<E>(error: E): Failure<E> {
  return {ok: false, error};
}

/**
 * Check if a result is successful.
 * TypeScript will narrow the type after this check.
 *
 * @example
 * if (isSuccess(result)) {
 *   // result.value is available here
 * }
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok;
}

/**
 * Check if a result is a failure.
 * TypeScript will narrow the type after this check.
 *
 * @example
 * if (isFailure(result)) {
 *   // result.error is available here
 * }
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.ok;
}

/**
 * Map over a successful result.
 * If the result is a failure, returns the failure unchanged.
 *
 * @example
 * const result = success(5);
 * const doubled = mapResult(result, x => x * 2); // success(10)
 */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) {
    return success(fn(result.value));
  }
  return result;
}

/**
 * Unwrap a result, throwing an error if it's a failure.
 * Use this when you want to convert a Result back to a throwing operation.
 *
 * @example
 * const value = unwrap(result); // throws if result is a failure
 */
export function unwrap<T>(result: Result<T, Error>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Get the value from a result, or a default value if it's a failure.
 *
 * @example
 * const value = unwrapOr(result, 'default');
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
}

// ============================================================================
// COMMON ERROR TYPES
// ============================================================================

/**
 * Error codes for common error types in the MCP server.
 */
export type ErrorCode =
  | 'INVALID_COLOR'
  | 'INVALID_PARAMETER'
  | 'SASS_COMPILATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN_ERROR';

/**
 * A structured error with code and message.
 * More informative than a plain Error string.
 */
export interface McpError {
  /** Error code for programmatic handling */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional context (e.g., which field failed validation) */
  context?: Record<string, unknown>;
}

/**
 * Create an MCP error.
 *
 * @example
 * const error = mcpError('INVALID_COLOR', 'Invalid hex color: #xyz');
 * const error = mcpError('VALIDATION_ERROR', 'Missing required field', { field: 'primary' });
 */
export function mcpError(code: ErrorCode, message: string, context?: Record<string, unknown>): McpError {
  return {code, message, context};
}

/**
 * Result type using McpError for failures.
 * This is the preferred result type for MCP operations.
 */
export type McpResult<T> = Result<T, McpError>;

// ============================================================================
// VALIDATION RESULT HELPERS
// ============================================================================

/**
 * Severity level for validation messages.
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * A validation error (fatal issue that prevents proceeding).
 *
 * Use for:
 * - Missing required values
 * - Invalid color/input formats
 * - Structural problems that make generation impossible
 */
export interface ValidationError {
  /** The field or path that failed validation (e.g., 'primary', 'primary.500') */
  field?: string;
  /** Error message describing the issue */
  message: string;
  /** Suggestion for how to fix the error */
  suggestion?: string;
  /** Current value that caused the error */
  currentValue?: string;
}

/**
 * A validation warning (non-fatal issue that should be reported).
 *
 * Use for:
 * - Suboptimal values that will still work
 * - Best practice violations
 * - Accessibility concerns
 */
export interface ValidationWarning {
  /** The field or path with a warning (e.g., 'surface', 'gray.50') */
  field?: string;
  /** Warning message describing the issue */
  message: string;
  /** Severity: 'warning' for potential problems, 'info' for suggestions */
  severity?: 'warning' | 'info';
  /** Suggestion for improvement */
  suggestion?: string;
  /** Current value that caused the warning */
  currentValue?: string;
  /** Suggested alternative values */
  suggestedValues?: string[];
  /** Additional technical details for advanced users */
  details?: Record<string, unknown>;
}

/**
 * Result of a validation operation.
 * Can contain both errors (fatal) and warnings (non-fatal).
 */
export interface ValidationResult<TMetadata = unknown> {
  /** Whether validation passed (no errors) */
  isValid: boolean;
  /** Validation errors (fatal issues that prevent proceeding) */
  errors: ValidationError[];
  /** Validation warnings (non-fatal issues that should be reported) */
  warnings: ValidationWarning[];
  /** Optional tips for the user (general guidance) */
  tips?: string[];
  /** Optional metadata from validation (e.g., analysis data) */
  metadata?: TMetadata;
}

/**
 * Create a successful validation result.
 */
export function validationSuccess<TMetadata = unknown>(
  warnings: ValidationWarning[] = [],
  options?: {tips?: string[]; metadata?: TMetadata}
): ValidationResult<TMetadata> {
  return {
    isValid: true,
    errors: [],
    warnings,
    tips: options?.tips,
    metadata: options?.metadata,
  };
}

/**
 * Create a failed validation result.
 */
export function validationFailure<TMetadata = unknown>(
  errors: ValidationError[],
  warnings: ValidationWarning[] = [],
  options?: {tips?: string[]; metadata?: TMetadata}
): ValidationResult<TMetadata> {
  return {
    isValid: false,
    errors,
    warnings,
    tips: options?.tips,
    metadata: options?.metadata,
  };
}

/**
 * Combine multiple validation results.
 * The combined result is invalid if any input result is invalid.
 */
export function combineValidationResults<TMetadata = unknown>(
  ...results: ValidationResult<TMetadata>[]
): ValidationResult<TMetadata> {
  const combined: ValidationResult<TMetadata> = {
    isValid: true,
    errors: [],
    warnings: [],
    tips: [],
  };

  for (const result of results) {
    if (!result.isValid) {
      combined.isValid = false;
    }
    combined.errors.push(...result.errors);
    combined.warnings.push(...result.warnings);
    if (result.tips) {
      combined.tips!.push(...result.tips);
    }
  }

  // Remove tips array if empty
  if (combined.tips!.length === 0) {
    delete combined.tips;
  }

  return combined;
}

/**
 * Options for formatting validation messages.
 */
export interface FormatValidationOptions {
  /** Include severity icons (default: true) */
  includeIcons?: boolean;
  /** Include suggested values (default: true) */
  includeSuggestions?: boolean;
  /** Include tips section (default: true) */
  includeTips?: boolean;
}

/**
 * Format validation errors and warnings for display.
 *
 * @param result - Validation result to format
 * @param options - Formatting options
 * @returns Formatted markdown string
 */
export function formatValidationMessages(result: ValidationResult, options: FormatValidationOptions = {}): string {
  const {includeIcons = true, includeSuggestions = true, includeTips = true} = options;
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push('**Errors:**');
    for (const error of result.errors) {
      const icon = includeIcons ? '❌ ' : '';
      const prefix = error.field ? `\`${error.field}\`: ` : '';
      lines.push(`- ${icon}${prefix}${error.message}`);
      if (includeSuggestions && error.suggestion) {
        lines.push(`  Suggestion: ${error.suggestion}`);
      }
    }
  }

  if (result.warnings.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('**Warnings:**');
    for (const warning of result.warnings) {
      const icon = includeIcons ? (warning.severity === 'info' ? 'ℹ️ ' : '⚠️ ') : '';
      const prefix = warning.field ? `\`${warning.field}\`: ` : '';
      lines.push(`- ${icon}${prefix}${warning.message}`);
      if (includeSuggestions) {
        if (warning.suggestedValues && warning.suggestedValues.length > 0) {
          lines.push(`  Suggested: ${warning.suggestedValues.join(', ')}`);
        } else if (warning.suggestion) {
          lines.push(`  Suggestion: ${warning.suggestion}`);
        }
      }
    }
  }

  if (includeTips && result.tips && result.tips.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('**Tips:**');
    for (const tip of result.tips) {
      const icon = includeIcons ? '💡 ' : '';
      lines.push(`- ${icon}${tip}`);
    }
  }

  return lines.join('\n');
}
