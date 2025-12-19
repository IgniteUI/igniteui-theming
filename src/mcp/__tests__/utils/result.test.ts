import {describe, it, expect} from 'vitest';
import {
  success,
  failure,
  isSuccess,
  isFailure,
  mapResult,
  unwrap,
  unwrapOr,
  mcpError,
  validationSuccess,
  validationFailure,
  combineValidationResults,
  formatValidationMessages,
  type Result,
  type McpResult,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from '../../utils/result';

describe('Result Type', () => {
  describe('success()', () => {
    it('creates a successful result with a value', () => {
      const result = success(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it('creates a successful result with an object value', () => {
      const value = {code: 'test', lines: 10};
      const result = success(value);
      expect(result.ok).toBe(true);
      expect(result.value).toEqual(value);
    });

    it('creates a successful result with null value', () => {
      const result = success(null);
      expect(result.ok).toBe(true);
      expect(result.value).toBeNull();
    });

    it('creates a successful result with undefined value', () => {
      const result = success(undefined);
      expect(result.ok).toBe(true);
      expect(result.value).toBeUndefined();
    });
  });

  describe('failure()', () => {
    it('creates a failed result with an error', () => {
      const error = new Error('Something went wrong');
      const result = failure(error);
      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
    });

    it('creates a failed result with a string error', () => {
      const result = failure('Invalid input');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Invalid input');
    });

    it('creates a failed result with an object error', () => {
      const error = {code: 'ERR_001', message: 'Failed'};
      const result = failure(error);
      expect(result.ok).toBe(false);
      expect(result.error).toEqual(error);
    });
  });

  describe('isSuccess()', () => {
    it('returns true for success results', () => {
      const result = success('value');
      expect(isSuccess(result)).toBe(true);
    });

    it('returns false for failure results', () => {
      const result = failure(new Error('error'));
      expect(isSuccess(result)).toBe(false);
    });

    it('narrows type correctly', () => {
      const result: Result<number, Error> = success(42);
      if (isSuccess(result)) {
        // TypeScript should allow accessing value here
        expect(result.value).toBe(42);
      }
    });
  });

  describe('isFailure()', () => {
    it('returns true for failure results', () => {
      const result = failure(new Error('error'));
      expect(isFailure(result)).toBe(true);
    });

    it('returns false for success results', () => {
      const result = success('value');
      expect(isFailure(result)).toBe(false);
    });

    it('narrows type correctly', () => {
      const result: Result<number, Error> = failure(new Error('test error'));
      if (isFailure(result)) {
        // TypeScript should allow accessing error here
        expect(result.error.message).toBe('test error');
      }
    });
  });

  describe('mapResult()', () => {
    it('transforms the value of a success result', () => {
      const result = success(5);
      const mapped = mapResult(result, (x) => x * 2);
      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.value).toBe(10);
      }
    });

    it('returns failure unchanged', () => {
      const error = new Error('original error');
      const result: Result<number, Error> = failure(error);
      const mapped = mapResult(result, (x: number) => x * 2);
      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) {
        expect(mapped.error).toBe(error);
      }
    });

    it('can change the type of the value', () => {
      const result = success(42);
      const mapped = mapResult(result, (x) => x.toString());
      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.value).toBe('42');
      }
    });
  });

  describe('unwrap()', () => {
    it('returns the value for a success result', () => {
      const result = success(42);
      expect(unwrap(result)).toBe(42);
    });

    it('throws the error for a failure result', () => {
      const error = new Error('test error');
      const result: Result<number, Error> = failure(error);
      expect(() => unwrap(result)).toThrow('test error');
    });
  });

  describe('unwrapOr()', () => {
    it('returns the value for a success result', () => {
      const result = success(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('returns the default value for a failure result', () => {
      const result: Result<number, Error> = failure(new Error('error'));
      expect(unwrapOr(result, 0)).toBe(0);
    });

    it('works with null as default', () => {
      const result: Result<string | null, Error> = failure(new Error('error'));
      expect(unwrapOr(result, null)).toBeNull();
    });
  });
});

describe('McpError', () => {
  describe('mcpError()', () => {
    it('creates an error with code and message', () => {
      const error = mcpError('INVALID_COLOR', 'Invalid hex color');
      expect(error.code).toBe('INVALID_COLOR');
      expect(error.message).toBe('Invalid hex color');
      expect(error.context).toBeUndefined();
    });

    it('creates an error with context', () => {
      const error = mcpError('VALIDATION_ERROR', 'Missing field', {field: 'primary'});
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Missing field');
      expect(error.context).toEqual({field: 'primary'});
    });

    it('supports all error codes', () => {
      const codes = [
        'INVALID_COLOR',
        'INVALID_PARAMETER',
        'SASS_COMPILATION_ERROR',
        'VALIDATION_ERROR',
        'NOT_FOUND',
        'UNKNOWN_ERROR',
      ] as const;

      for (const code of codes) {
        const error = mcpError(code, 'test');
        expect(error.code).toBe(code);
      }
    });
  });

  describe('McpResult type', () => {
    it('can be used as Result with McpError', () => {
      const successResult: McpResult<string> = success('generated code');
      const failureResult: McpResult<string> = failure(mcpError('INVALID_COLOR', 'Bad color'));

      expect(isSuccess(successResult)).toBe(true);
      expect(isFailure(failureResult)).toBe(true);
    });
  });
});

describe('ValidationResult', () => {
  describe('validationSuccess()', () => {
    it('creates a valid result with no warnings', () => {
      const result = validationSuccess();
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('creates a valid result with warnings', () => {
      const warnings: ValidationWarning[] = [{message: 'Consider using a lighter shade'}];
      const result = validationSuccess(warnings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual(warnings);
    });
  });

  describe('validationFailure()', () => {
    it('creates an invalid result with errors', () => {
      const errors: ValidationError[] = [{message: 'Invalid color', field: 'primary'}];
      const result = validationFailure(errors);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(errors);
      expect(result.warnings).toEqual([]);
    });

    it('creates an invalid result with errors and warnings', () => {
      const errors: ValidationError[] = [{message: 'Invalid color'}];
      const warnings: ValidationWarning[] = [{message: 'Consider accessibility'}];
      const result = validationFailure(errors, warnings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(errors);
      expect(result.warnings).toEqual(warnings);
    });
  });

  describe('combineValidationResults()', () => {
    it('combines multiple valid results', () => {
      const result1 = validationSuccess();
      const result2 = validationSuccess();
      const combined = combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toEqual([]);
    });

    it('combines valid results with warnings', () => {
      const result1 = validationSuccess([{message: 'warning 1'}]);
      const result2 = validationSuccess([{message: 'warning 2'}]);
      const combined = combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(true);
      expect(combined.warnings).toHaveLength(2);
      expect(combined.warnings[0].message).toBe('warning 1');
      expect(combined.warnings[1].message).toBe('warning 2');
    });

    it('returns invalid if any result is invalid', () => {
      const valid = validationSuccess();
      const invalid = validationFailure([{message: 'error'}]);
      const combined = combineValidationResults(valid, invalid);
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toHaveLength(1);
    });

    it('combines all errors from multiple invalid results', () => {
      const result1 = validationFailure([{message: 'error 1'}]);
      const result2 = validationFailure([{message: 'error 2'}]);
      const combined = combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toHaveLength(2);
    });

    it('handles empty array', () => {
      const combined = combineValidationResults();
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toEqual([]);
      expect(combined.warnings).toEqual([]);
    });

    it('preserves error and warning details', () => {
      const result1 = validationFailure(
        [{message: 'error', field: 'primary', suggestion: 'use hex'}],
        [{message: 'warning', field: 'secondary'}],
      );
      const result2 = validationSuccess([{message: 'info', suggestion: 'consider contrast'}]);
      const combined = combineValidationResults(result1, result2);

      expect(combined.errors[0].field).toBe('primary');
      expect(combined.errors[0].suggestion).toBe('use hex');
      expect(combined.warnings[0].field).toBe('secondary');
      expect(combined.warnings[1].suggestion).toBe('consider contrast');
    });
  });

  describe('formatValidationMessages()', () => {
    it('formats errors only', () => {
      const result = validationFailure([{message: 'Invalid color'}, {message: 'Missing shade'}]);
      const formatted = formatValidationMessages(result);
      expect(formatted).toContain('**Errors:**');
      expect(formatted).toContain('Invalid color');
      expect(formatted).toContain('Missing shade');
      expect(formatted).not.toContain('**Warnings:**');
    });

    it('formats warnings only', () => {
      const result = validationSuccess([{message: 'Consider accessibility'}]);
      const formatted = formatValidationMessages(result);
      expect(formatted).toContain('**Warnings:**');
      expect(formatted).toContain('Consider accessibility');
      expect(formatted).not.toContain('**Errors:**');
    });

    it('formats both errors and warnings', () => {
      const result = validationFailure([{message: 'Invalid'}], [{message: 'Warning'}]);
      const formatted = formatValidationMessages(result);
      expect(formatted).toContain('**Errors:**');
      expect(formatted).toContain('**Warnings:**');
    });

    it('includes field prefix when present', () => {
      const result = validationFailure([{message: 'Invalid color', field: 'primary'}]);
      const formatted = formatValidationMessages(result);
      expect(formatted).toContain('`primary`');
      expect(formatted).toContain('Invalid color');
    });

    it('includes suggestions when present', () => {
      const result = validationFailure([{message: 'Invalid', suggestion: 'Try using hex format'}]);
      const formatted = formatValidationMessages(result);
      expect(formatted).toContain('Suggestion: Try using hex format');
    });

    it('returns empty string for valid result without warnings', () => {
      const result = validationSuccess();
      const formatted = formatValidationMessages(result);
      expect(formatted).toBe('');
    });

    it('formats complex validation result correctly', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [
          {field: 'primary', message: 'Invalid hex color', suggestion: 'Use format #RRGGBB'},
          {message: 'Missing required shade 500'},
        ],
        warnings: [
          {field: 'contrast', message: 'Low contrast ratio', suggestion: 'Consider WCAG guidelines'},
        ],
      };
      const formatted = formatValidationMessages(result);

      expect(formatted).toContain('**Errors:**');
      expect(formatted).toContain('`primary`');
      expect(formatted).toContain('Invalid hex color');
      expect(formatted).toContain('Suggestion: Use format #RRGGBB');
      expect(formatted).toContain('Missing required shade 500');
      expect(formatted).toContain('**Warnings:**');
      expect(formatted).toContain('`contrast`');
      expect(formatted).toContain('Low contrast ratio');
      expect(formatted).toContain('Suggestion: Consider WCAG guidelines');
    });

    it('formats tips when present', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [{message: 'Error'}],
        warnings: [],
        tips: ['Use lighter colors', 'Consider contrast ratio'],
      };
      const formatted = formatValidationMessages(result);

      expect(formatted).toContain('**Tips:**');
      expect(formatted).toContain('Use lighter colors');
      expect(formatted).toContain('Consider contrast ratio');
    });

    it('respects includeIcons option', () => {
      const result = validationFailure([{message: 'Error'}], [{message: 'Warning'}]);
      const formatted = formatValidationMessages(result, {includeIcons: false});
      expect(formatted).not.toContain('❌');
      expect(formatted).not.toContain('⚠️');
    });

    it('shows info icon for info severity warnings', () => {
      const result = validationSuccess([{message: 'Info message', severity: 'info'}]);
      const formatted = formatValidationMessages(result);
      expect(formatted).toContain('ℹ️');
    });

    it('includes suggestedValues when present', () => {
      const result = validationSuccess([{message: 'Warning', suggestedValues: ['#fff', '#000']}]);
      const formatted = formatValidationMessages(result);
      expect(formatted).toContain('Suggested: #fff, #000');
    });
  });
});
