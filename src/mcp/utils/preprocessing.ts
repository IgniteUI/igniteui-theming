/**
 * Generic preprocessing utilities for MCP tool inputs.
 *
 * Handles cases where MCP clients (like MCP Inspector) serialize nested objects
 * as JSON strings when users type them in text fields.
 */

import type { z } from "zod";

/**
 * Recursively parse JSON strings in a value.
 *
 * This function handles cases where nested objects are passed as JSON strings
 * (e.g., from MCP Inspector text fields or MCP clients that send nested objects as strings).
 * It only attempts to parse strings that look like JSON objects or arrays (starting with `{` or `[`).
 *
 * @param value - The value to process
 * @returns The value with any JSON strings parsed into objects/arrays
 *
 * @example
 * // String that looks like JSON is parsed
 * deepParseJsonStrings('{"mode": "shades"}') // => { mode: 'shades' }
 *
 * // Regular strings are left as-is
 * deepParseJsonStrings('hello') // => 'hello'
 *
 * // Nested objects are processed recursively
 * deepParseJsonStrings({ primary: '{"mode": "shades"}' })
 * // => { primary: { mode: 'shades' } }
 */
export function deepParseJsonStrings(value: unknown): unknown {
	if (typeof value === "string") {
		const trimmed = value.trim();

		if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
			try {
				const parsed = JSON.parse(trimmed);

				// Recurse in case the parsed value contains more JSON strings
				return deepParseJsonStrings(parsed);
			} catch {
				// Invalid JSON, keep as string
				return value;
			}
		}
		return value;
	}

	if (Array.isArray(value)) {
		return value.map(deepParseJsonStrings);
	}

	if (value !== null && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([k, v]) => [k, deepParseJsonStrings(v)]),
		);
	}

	return value;
}

/**
 * Create a tool handler with automatic JSON string preprocessing.
 *
 * This wrapper ensures that nested objects passed as JSON strings (common when
 * using MCP Inspector) are properly parsed before schema validation.
 *
 * @param schema - The Zod schema for validating the tool's parameters
 * @param handler - The tool handler function
 * @returns A wrapped handler that preprocesses inputs before validation
 *
 * @example
 * server.registerTool(
 *   'create_custom_palette',
 *   { ... },
 *   withPreprocessing(createCustomPaletteSchema, handleCreateCustomPalette)
 * );
 */
export function withPreprocessing<
	TParams,
	TResult extends Record<string, unknown>,
>(
	schema: z.ZodSchema<TParams>,
	handler: (params: TParams) => Promise<TResult> | TResult,
): (params: unknown) => Promise<TResult> {
	return async (rawParams: unknown) => {
		const preprocessed = deepParseJsonStrings(rawParams);
		const validated = schema.parse(preprocessed);

		return handler(validated);
	};
}
