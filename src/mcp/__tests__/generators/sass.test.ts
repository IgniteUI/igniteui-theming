/**
 * Tests for Sass code generators.
 *
 * These tests verify:
 * 1. Generated code contains expected Sass constructs
 * 2. Generated code structure is correct for each platform
 * 3. Variables and descriptions are set correctly
 * 4. Generated code compiles as valid Sass (compilation tests)
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass-embedded";
import { describe, expect, it } from "vitest";
import {
	generateComponentTheme,
	generateElevations,
	generatePalette,
	generateTheme,
	generateTypography,
} from "../../generators/sass.js";

// Get the package root directory (where sass/ folder is located)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// From src/mcp/__tests__/generators/ we need to go up 4 levels to package root
const PACKAGE_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

/**
 * Rewrites generated Sass code to use local paths for testing.
 * Replaces package imports with local sass/ directory imports.
 *
 * Handles:
 * - Base module: @use 'igniteui-theming' as *; → @use 'sass' as *;
 * - Angular module: @use "igniteui-angular/theming" as *; → @use 'sass' as *;
 * - Sub-module presets: @use 'igniteui-theming/sass/...' as *; → @use 'sass/...' as *;
 */
function rewriteImportsForTesting(code: string): string {
	return code
		.replace(
			/@use ['"]igniteui-angular\/theming['"] as \*;/g,
			"@use 'sass' as *;",
		)
		.replace(
			/@use ['"]igniteui-theming\/sass\/(.+?)['"] as \*;/g,
			"@use 'sass/$1' as *;",
		)
		.replace(/@use ['"]igniteui-theming['"] as \*;/g, "@use 'sass' as *;");
}

/**
 * Helper to compile Sass code and verify it's valid.
 * Returns the compiled CSS or throws on error.
 */
async function compileSass(code: string): Promise<string> {
	const testCode = rewriteImportsForTesting(code);
	const result = await sass.compileStringAsync(testCode, {
		loadPaths: [PACKAGE_ROOT],
	});
	return result.css;
}

/**
 * Helper to check if Sass code compiles without errors.
 */
async function isValidSass(code: string): Promise<boolean> {
	try {
		await compileSass(code);
		return true;
	} catch {
		return false;
	}
}

describe("generatePalette", () => {
	it("generates valid Sass code that compiles", async () => {
		const result = generatePalette({
			primary: "#2ab759",
			secondary: "#f7bd32",
			surface: "white",
		});

		expect(result.code).toContain("@use");
		expect(result.code).toContain("palette(");
		expect(result.code).toContain("$primary: #2ab759");
		expect(result.code).toContain("$secondary: #f7bd32");
		expect(result.code).toContain("$surface: white");
		// This should compile because palette() has all required args
		expect(await isValidSass(result.code)).toBe(true);
	});

	it("includes optional colors when provided", async () => {
		const result = generatePalette({
			primary: "#2ab759",
			secondary: "#f7bd32",
			surface: "white",
			gray: "#333",
			info: "#0288d1",
			success: "#4caf50",
			warn: "#ff9800",
			error: "#f44336",
		});

		expect(result.code).toContain("$gray: #333");
		expect(result.code).toContain("$info: #0288d1");
		expect(result.code).toContain("$success: #4caf50");
		expect(result.code).toContain("$warn: #ff9800");
		expect(result.code).toContain("$error: #f44336");
		expect(await isValidSass(result.code)).toBe(true);
	});

	it("uses custom name for palette variable", () => {
		const result = generatePalette({
			primary: "#2ab759",
			secondary: "#f7bd32",
			surface: "white",
			name: "my-brand",
		});

		expect(result.variables).toContain("$my-brand-palette");
		expect(result.code).toContain("$my-brand-palette");
	});

	it("uses variant in default variable name", () => {
		const result = generatePalette({
			primary: "#2ab759",
			secondary: "#f7bd32",
			surface: "#121212",
			variant: "dark",
		});

		expect(result.variables).toContain("$custom-dark-palette");
		expect(result.description).toContain("dark");
	});

	it("uses Angular import for angular platform", () => {
		const result = generatePalette({
			platform: "angular",
			primary: "#2ab759",
			secondary: "#f7bd32",
			surface: "white",
		});

		expect(result.code).toContain("igniteui-angular/theming");
	});

	it("uses generic import for webcomponents platform", () => {
		const result = generatePalette({
			platform: "webcomponents",
			primary: "#2ab759",
			secondary: "#f7bd32",
			surface: "white",
		});

		expect(result.code).toContain("igniteui-theming");
		expect(result.code).not.toContain("igniteui-angular");
	});
});

describe("generateTypography", () => {
	it("generates code with correct structure", () => {
		const result = generateTypography({
			fontFamily: "Roboto",
		});

		expect(result.code).toContain("@use");
		expect(result.code).toContain("@include typography(");
		expect(result.code).toContain("$font-family:");
		expect(result.code).toContain("$type-scale:");
	});

	it("uses design system type scale variable", () => {
		const result = generateTypography({
			fontFamily: "Roboto",
			designSystem: "indigo",
		});

		expect(result.variables).toContain("$indigo-type-scale");
		expect(result.code).toContain("$indigo-type-scale");
		expect(result.description).toContain("indigo");
	});

	it("quotes font family correctly", () => {
		const result = generateTypography({
			fontFamily: "Open Sans",
		});

		expect(result.code).toContain("'Open Sans'");
	});

	it("handles font stacks with quotes", () => {
		const result = generateTypography({
			fontFamily: "'Titillium Web', sans-serif",
		});

		// Font stack should be wrapped in quotes
		expect(result.code).toContain("\"'Titillium Web', sans-serif\"");
	});

	it("includes typography preset import for non-Angular platforms", () => {
		const result = generateTypography({
			fontFamily: "Roboto",
			designSystem: "material",
		});

		expect(result.code).toContain(
			"@use 'igniteui-theming/sass/typography/presets' as *;",
		);
	});

	it("omits typography preset import for Angular platform", () => {
		const result = generateTypography({
			platform: "angular",
			fontFamily: "Roboto",
			designSystem: "material",
		});

		expect(result.code).not.toContain("typography/presets");
		expect(result.code).toContain("igniteui-angular/theming");
	});

	it("generates valid Sass that compiles for webcomponents", async () => {
		const result = generateTypography({
			platform: "webcomponents",
			fontFamily: "Roboto",
		});
		expect(await isValidSass(result.code)).toBe(true);
	});

	it("generates valid Sass that compiles for react", async () => {
		const result = generateTypography({
			platform: "react",
			fontFamily: "Roboto",
		});
		expect(await isValidSass(result.code)).toBe(true);
	});

	it("generates valid Sass that compiles for blazor", async () => {
		const result = generateTypography({
			platform: "blazor",
			fontFamily: "Roboto",
		});
		expect(await isValidSass(result.code)).toBe(true);
	});

	it("generates valid Sass that compiles with no platform", async () => {
		const result = generateTypography({
			fontFamily: "Roboto",
		});
		expect(await isValidSass(result.code)).toBe(true);
	});

	it("compiles for all design systems", async () => {
		for (const ds of ["material", "fluent", "bootstrap", "indigo"] as const) {
			const result = generateTypography({
				fontFamily: "Roboto",
				designSystem: ds,
			});
			expect(await isValidSass(result.code)).toBe(true);
		}
	});
});

describe("generateElevations", () => {
	it("generates code with correct structure", () => {
		const result = generateElevations({});

		expect(result.code).toContain("@use");
		expect(result.code).toContain("@include elevations(");
	});

	it("uses material elevations by default", () => {
		const result = generateElevations({});

		expect(result.variables).toContain("$material-elevations");
		expect(result.code).toContain("$material-elevations");
	});

	it("uses indigo elevations when specified", () => {
		const result = generateElevations({
			designSystem: "indigo",
		});

		expect(result.variables).toContain("$indigo-elevations");
		expect(result.code).toContain("$indigo-elevations");
	});

	it("includes elevations preset import for non-Angular platforms", () => {
		const result = generateElevations({});

		expect(result.code).toContain(
			"@use 'igniteui-theming/sass/elevations/presets' as *;",
		);
	});

	it("omits elevations preset import for Angular platform", () => {
		const result = generateElevations({
			platform: "angular",
		});

		expect(result.code).not.toContain("elevations/presets");
		expect(result.code).toContain("igniteui-angular/theming");
	});

	it("generates valid Sass that compiles for webcomponents", async () => {
		const result = generateElevations({
			platform: "webcomponents",
		});
		expect(await isValidSass(result.code)).toBe(true);
	});

	it("generates valid Sass that compiles for react", async () => {
		const result = generateElevations({
			platform: "react",
		});
		expect(await isValidSass(result.code)).toBe(true);
	});

	it("generates valid Sass that compiles for blazor", async () => {
		const result = generateElevations({
			platform: "blazor",
		});
		expect(await isValidSass(result.code)).toBe(true);
	});

	it("generates valid Sass that compiles with no platform", async () => {
		const result = generateElevations({});
		expect(await isValidSass(result.code)).toBe(true);
	});

	it("compiles with indigo design system", async () => {
		const result = generateElevations({
			designSystem: "indigo",
		});
		expect(await isValidSass(result.code)).toBe(true);
		expect(result.code).toContain("$indigo-elevations");
	});
});

describe("generateTheme", () => {
	describe("platform-agnostic (no platform specified)", () => {
		it("generates code with correct structure", () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
			});

			expect(result.code).toContain("@use");
			expect(result.code).toContain("palette(");
			expect(result.code).toContain("@include palette(");
		});

		it("includes typography by default", () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
			});

			expect(result.code).toContain("@include typography(");
		});

		it("includes elevations by default", () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
			});

			expect(result.code).toContain("@include elevations(");
		});

		it("can exclude typography", () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
				includeTypography: false,
			});

			expect(result.code).not.toContain("@include typography(");
		});

		it("can exclude elevations", () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
				includeElevations: false,
			});

			expect(result.code).not.toContain("@include elevations(");
		});

		it("uses dark surface color for dark variant", () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
				variant: "dark",
			});

			expect(result.code).toContain("$surface: #222222");
		});

		it("generates valid Sass that compiles with defaults", async () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
				secondaryColor: "#f7bd32",
				surfaceColor: "white",
			});
			expect(await isValidSass(result.code)).toBe(true);
		});

		it("generates valid Sass that compiles without typography", async () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
				secondaryColor: "#f7bd32",
				surfaceColor: "white",
				includeTypography: false,
			});
			expect(await isValidSass(result.code)).toBe(true);
			expect(result.code).not.toContain("typography/presets");
		});

		it("generates valid Sass that compiles without elevations", async () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
				secondaryColor: "#f7bd32",
				surfaceColor: "white",
				includeElevations: false,
			});
			expect(await isValidSass(result.code)).toBe(true);
			expect(result.code).not.toContain("elevations/presets");
		});

		it("includes preset imports for typography and elevations", () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
				designSystem: "material",
			});

			expect(result.code).toContain(
				"@use 'igniteui-theming/sass/typography/presets' as *;",
			);
			expect(result.code).toContain(
				"@use 'igniteui-theming/sass/elevations/presets' as *;",
			);
		});
	});

	describe("Angular platform", () => {
		it("generates code with core() and theme() mixins", () => {
			const result = generateTheme({
				platform: "angular",
				primaryColor: "#2ab759",
				designSystem: "material",
			});

			expect(result.code).toContain("igniteui-angular/theming");
			expect(result.code).toContain("@include core()");
			expect(result.code).toContain("@include theme(");
			expect(result.description).toContain("Angular");
		});

		it("uses design system schema", () => {
			const result = generateTheme({
				platform: "angular",
				primaryColor: "#2ab759",
				designSystem: "indigo",
				variant: "dark",
			});

			expect(result.variables).toContain("$dark-indigo-schema");
		});
	});

	describe("Web Components platform", () => {
		it("generates code with individual mixins", () => {
			const result = generateTheme({
				platform: "webcomponents",
				primaryColor: "#2ab759",
				designSystem: "material",
			});

			expect(result.code).toContain("igniteui-theming");
			expect(result.code).not.toContain("igniteui-angular");
			expect(result.code).toContain("@include palette(");
			expect(result.description).toContain("Web Components");
		});

		it("includes spacing by default", () => {
			const result = generateTheme({
				platform: "webcomponents",
				primaryColor: "#2ab759",
			});

			expect(result.code).toContain("@include spacing(");
		});

		it("can exclude spacing", () => {
			const result = generateTheme({
				platform: "webcomponents",
				primaryColor: "#2ab759",
				includeSpacing: false,
			});

			expect(result.code).not.toContain("@include spacing(");
		});

		it("uses correct elevation preset for design system", () => {
			const indigoResult = generateTheme({
				platform: "webcomponents",
				primaryColor: "#2ab759",
				designSystem: "indigo",
			});

			expect(indigoResult.variables).toContain("$indigo-elevations");

			const materialResult = generateTheme({
				platform: "webcomponents",
				primaryColor: "#2ab759",
				designSystem: "material",
			});

			expect(materialResult.variables).toContain("$material-elevations");
		});
	});

	describe("React platform", () => {
		it("generates Web Components-style code (uses igniteui-theming)", () => {
			const result = generateTheme({
				platform: "react",
				primaryColor: "#2ab759",
				designSystem: "material",
			});

			expect(result.code).toContain("igniteui-theming");
			expect(result.code).not.toContain("igniteui-angular");
		});

		it("generates individual mixins, not Angular core()/theme() pattern", () => {
			const result = generateTheme({
				platform: "react",
				primaryColor: "#2ab759",
				designSystem: "material",
			});

			expect(result.code).toContain("@include palette(");
			expect(result.code).toContain("@include elevations(");
			expect(result.code).toContain("@include typography(");
			// Angular-specific: core() mixin is never used in Web Components/React/Blazor
			expect(result.code).not.toContain("@include core(");
			// Note: WC generator creates a @mixin theme() wrapper, but does NOT use Angular's theme() mixin
			// The key difference is: no $schema parameter and no igniteui-angular/theming import
			expect(result.code).not.toContain("$schema:");
		});

		it("includes spacing by default", () => {
			const result = generateTheme({
				platform: "react",
				primaryColor: "#2ab759",
			});

			expect(result.code).toContain("@include spacing(");
		});

		it("can exclude spacing", () => {
			const result = generateTheme({
				platform: "react",
				primaryColor: "#2ab759",
				includeSpacing: false,
			});

			expect(result.code).not.toContain("@include spacing(");
		});

		it("uses correct elevation preset for design system", () => {
			const indigoResult = generateTheme({
				platform: "react",
				primaryColor: "#2ab759",
				designSystem: "indigo",
			});

			expect(indigoResult.variables).toContain("$indigo-elevations");

			const materialResult = generateTheme({
				platform: "react",
				primaryColor: "#2ab759",
				designSystem: "material",
			});

			expect(materialResult.variables).toContain("$material-elevations");
		});

		it("description mentions Web Components (shared generator)", () => {
			const result = generateTheme({
				platform: "react",
				primaryColor: "#2ab759",
			});

			expect(result.description).toContain("Web Components");
		});
	});

	describe("Blazor platform", () => {
		it("generates Web Components-style code (uses igniteui-theming)", () => {
			const result = generateTheme({
				platform: "blazor",
				primaryColor: "#2ab759",
				designSystem: "material",
			});

			expect(result.code).toContain("igniteui-theming");
			expect(result.code).not.toContain("igniteui-angular");
		});

		it("generates individual mixins, not Angular core()/theme() pattern", () => {
			const result = generateTheme({
				platform: "blazor",
				primaryColor: "#2ab759",
				designSystem: "material",
			});

			expect(result.code).toContain("@include palette(");
			expect(result.code).toContain("@include elevations(");
			expect(result.code).toContain("@include typography(");
			// Angular-specific: core() mixin is never used in Web Components/React/Blazor
			expect(result.code).not.toContain("@include core(");
			// Note: WC generator creates a @mixin theme() wrapper, but does NOT use Angular's theme() mixin
			// The key difference is: no $schema parameter and no igniteui-angular/theming import
			expect(result.code).not.toContain("$schema:");
		});

		it("includes spacing by default", () => {
			const result = generateTheme({
				platform: "blazor",
				primaryColor: "#2ab759",
			});

			expect(result.code).toContain("@include spacing(");
		});

		it("uses correct elevation preset for design system", () => {
			const indigoResult = generateTheme({
				platform: "blazor",
				primaryColor: "#2ab759",
				designSystem: "indigo",
			});

			expect(indigoResult.variables).toContain("$indigo-elevations");

			const materialResult = generateTheme({
				platform: "blazor",
				primaryColor: "#2ab759",
				designSystem: "material",
			});

			expect(materialResult.variables).toContain("$material-elevations");
		});

		it("description mentions Web Components (shared generator)", () => {
			const result = generateTheme({
				platform: "blazor",
				primaryColor: "#2ab759",
			});

			expect(result.description).toContain("Web Components");
		});
	});

	describe("custom naming", () => {
		it("uses custom name for palette variable", () => {
			const result = generateTheme({
				primaryColor: "#2ab759",
				name: "my-brand",
			});

			expect(result.variables).toContain("$my-brand-palette");
			expect(result.code).toContain("$my-brand-palette");
		});

		it("uses custom name in Angular theme", () => {
			const result = generateTheme({
				platform: "angular",
				primaryColor: "#2ab759",
				name: "corporate",
			});

			expect(result.variables).toContain("$corporate-palette");
		});

		it("uses custom name in Web Components theme", () => {
			const result = generateTheme({
				platform: "webcomponents",
				primaryColor: "#2ab759",
				name: "app-theme",
			});

			expect(result.variables).toContain("$app-theme-palette");
		});
	});
});

describe("generateComponentTheme", () => {
	it("uses @include tokens() mixin in output", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			tokens: { background: "#ff0000" },
		});

		expect(result.code).toContain("@include tokens(");
	});

	it("does NOT contain css-vars-from-theme", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			tokens: { background: "#ff0000" },
		});

		expect(result.code).not.toContain("css-vars-from-theme");
		expect(result.code).not.toContain("css-vars(");
	});

	it("uses correct selector for Angular platform", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			tokens: { background: "#ff0000" },
		});

		// Should contain a selector block wrapping the tokens include
		expect(result.code).toMatch(/\{[\s\S]*@include tokens\(/);
	});

	it("uses correct selector for Web Components platform", () => {
		const result = generateComponentTheme({
			platform: "webcomponents",
			component: "avatar",
			tokens: { background: "#ff0000" },
		});

		expect(result.code).toMatch(/\{[\s\S]*@include tokens\(/);
	});

	it("uses custom selector when provided", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			tokens: { background: "#ff0000" },
			selector: ".my-custom-avatar",
		});

		expect(result.code).toContain(".my-custom-avatar {");
		expect(result.code).toContain("@include tokens(");
	});

	it("includes schema variable based on designSystem and variant", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			designSystem: "indigo",
			variant: "dark",
			tokens: { background: "#ff0000" },
		});

		expect(result.code).toContain("$schema: $dark-indigo-schema");
	});

	it("defaults to material light schema", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			tokens: { background: "#ff0000" },
		});

		expect(result.code).toContain("$schema: $light-material-schema");
	});

	it("includes token arguments in the theme function call", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			tokens: { background: "#ff0000", color: "white" },
		});

		expect(result.code).toContain("$background: #ff0000");
		expect(result.code).toContain("$color: white");
	});

	it("uses custom variable name when provided", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			tokens: { background: "#ff0000" },
			name: "my-avatar",
		});

		expect(result.variables).toContain("$my-avatar");
		expect(result.code).toContain("$my-avatar:");
	});

	it("uses default variable name when not provided", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			tokens: { background: "#ff0000" },
		});

		expect(result.variables).toContain("$custom-avatar-theme");
		expect(result.code).toContain("$custom-avatar-theme:");
	});

	it("throws for unknown component", () => {
		expect(() =>
			generateComponentTheme({
				platform: "angular",
				component: "__nonexistent_component__",
				tokens: { background: "#ff0000" },
			}),
		).toThrow("Unknown component");
	});

	it("uses Angular import for angular platform", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			tokens: { background: "#ff0000" },
		});

		expect(result.code).toContain("igniteui-angular/theming");
	});

	it("uses generic import for webcomponents platform", () => {
		const result = generateComponentTheme({
			platform: "webcomponents",
			component: "avatar",
			tokens: { background: "#ff0000" },
		});

		expect(result.code).toContain("igniteui-theming");
		expect(result.code).not.toContain("igniteui-angular");
	});

	it("includes description with component name and token count", () => {
		const result = generateComponentTheme({
			platform: "angular",
			component: "avatar",
			tokens: { background: "#ff0000", color: "white" },
		});

		expect(result.description).toContain("avatar");
		expect(result.description).toContain("2 token(s)");
	});
});
