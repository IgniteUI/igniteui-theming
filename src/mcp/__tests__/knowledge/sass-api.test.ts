/**
 * Tests for Sass API Manifest.
 *
 * These tests verify that the centralized Sass API knowledge is correct
 * and that helper functions work as expected.
 */

import { describe, expect, it } from "vitest";
import {
	CORE_MIXIN,
	CSS_VARIABLE_PATTERNS,
	ELEVATIONS_MIXIN,
	getElevationsVariable,
	getImportPath,
	getPaletteColorGroups,
	IMPORT_PATHS,
	isMixinSupported,
	PALETTE_FUNCTION,
	PALETTE_MIXIN,
	SHADES_FUNCTION,
	SPACING_MIXIN,
	THEME_MIXIN,
	TYPOGRAPHY_MIXIN,
	VARIABLE_PATTERNS,
} from "../../knowledge/sass-api.js";
import { generateUseStatement } from "../../utils/sass.js";

describe("IMPORT_PATHS", () => {
	it("has correct path for Angular", () => {
		expect(IMPORT_PATHS.angular).toBe("igniteui-angular/theming");
	});

	it("has correct path for Web Components", () => {
		expect(IMPORT_PATHS.webcomponents).toBe("igniteui-theming");
	});

	it("has correct generic path", () => {
		expect(IMPORT_PATHS.generic).toBe("igniteui-theming");
	});
});

describe("getImportPath", () => {
	it("returns Angular path for angular platform", () => {
		expect(getImportPath("angular")).toBe("igniteui-angular/theming");
	});

	it("returns default path for webcomponents platform", () => {
		expect(getImportPath("webcomponents")).toBe("igniteui-theming");
	});

	it("returns default path when platform is undefined", () => {
		expect(getImportPath()).toBe("igniteui-theming");
	});
});

describe("PALETTE_FUNCTION", () => {
	it("has correct function name", () => {
		expect(PALETTE_FUNCTION.name).toBe("palette");
	});

	it("has all required parameters", () => {
		expect(PALETTE_FUNCTION.requiredParams).toContain("primary");
		expect(PALETTE_FUNCTION.requiredParams).toContain("secondary");
		expect(PALETTE_FUNCTION.requiredParams).toContain("surface");
		expect(PALETTE_FUNCTION.requiredParams).toHaveLength(3);
	});

	it("has optional color parameters", () => {
		expect(PALETTE_FUNCTION.optionalParams).toContain("gray");
		expect(PALETTE_FUNCTION.optionalParams).toContain("info");
		expect(PALETTE_FUNCTION.optionalParams).toContain("success");
		expect(PALETTE_FUNCTION.optionalParams).toContain("warn");
		expect(PALETTE_FUNCTION.optionalParams).toContain("error");
	});
});

describe("SHADES_FUNCTION", () => {
	it("has correct function name", () => {
		expect(SHADES_FUNCTION.name).toBe("shades");
	});

	it("has correct chromatic shade levels", () => {
		expect(SHADES_FUNCTION.chromaticShadeLevels).toContain("50");
		expect(SHADES_FUNCTION.chromaticShadeLevels).toContain("500");
		expect(SHADES_FUNCTION.chromaticShadeLevels).toContain("900");
		expect(SHADES_FUNCTION.chromaticShadeLevels).toContain("A100");
		expect(SHADES_FUNCTION.chromaticShadeLevels).toContain("A700");
		expect(SHADES_FUNCTION.chromaticShadeLevels).toHaveLength(14);
	});

	it("has correct gray shade levels (no accent shades)", () => {
		expect(SHADES_FUNCTION.grayShadeLevels).toContain("50");
		expect(SHADES_FUNCTION.grayShadeLevels).toContain("900");
		expect(SHADES_FUNCTION.grayShadeLevels).not.toContain("A100");
		expect(SHADES_FUNCTION.grayShadeLevels).toHaveLength(10);
	});
});

describe("TYPOGRAPHY_MIXIN", () => {
	it("has correct mixin name", () => {
		expect(TYPOGRAPHY_MIXIN.name).toBe("typography");
	});

	it("has font-family and type-scale params", () => {
		expect(TYPOGRAPHY_MIXIN.params).toContain("$font-family");
		expect(TYPOGRAPHY_MIXIN.params).toContain("$type-scale");
	});

	it("has Angular root class defined", () => {
		expect(TYPOGRAPHY_MIXIN.angularRootClass).toBe("ig-typography");
	});
});

describe("ELEVATIONS_MIXIN", () => {
	it("has correct mixin name", () => {
		expect(ELEVATIONS_MIXIN.name).toBe("elevations");
	});

	it("has 25 elevation levels (0-24)", () => {
		expect(ELEVATIONS_MIXIN.levelCount).toBe(25);
	});
});

describe("PALETTE_MIXIN", () => {
	it("has correct mixin name", () => {
		expect(PALETTE_MIXIN.name).toBe("palette");
	});
});

describe("SPACING_MIXIN", () => {
	it("has correct mixin name", () => {
		expect(SPACING_MIXIN.name).toBe("spacing");
	});

	it("is supported only for webcomponents", () => {
		expect(SPACING_MIXIN.supportedPlatforms).toContain("webcomponents");
		expect(SPACING_MIXIN.supportedPlatforms).not.toContain("angular");
	});
});

describe("CORE_MIXIN", () => {
	it("has correct mixin name", () => {
		expect(CORE_MIXIN.name).toBe("core");
	});

	it("is supported only for angular", () => {
		expect(CORE_MIXIN.supportedPlatforms).toContain("angular");
		expect(CORE_MIXIN.supportedPlatforms).not.toContain("webcomponents");
	});

	it("has correct default values for optional params", () => {
		expect(CORE_MIXIN.optionalParams["$print-layout"]).toBe(true);
		expect(CORE_MIXIN.optionalParams["$enhanced-accessibility"]).toBe(false);
	});
});

describe("THEME_MIXIN", () => {
	it("has correct mixin name", () => {
		expect(THEME_MIXIN.name).toBe("theme");
	});

	it("is supported only for angular", () => {
		expect(THEME_MIXIN.supportedPlatforms).toContain("angular");
	});

	it("has palette and schema as required params", () => {
		expect(THEME_MIXIN.requiredParams).toContain("$palette");
		expect(THEME_MIXIN.requiredParams).toContain("$schema");
	});
});

describe("CSS_VARIABLE_PATTERNS", () => {
	it("has correct theme variables", () => {
		expect(CSS_VARIABLE_PATTERNS.theme).toBe("--ig-theme");
		expect(CSS_VARIABLE_PATTERNS.themeVariant).toBe("--ig-theme-variant");
	});

	it("has correct size variables", () => {
		expect(CSS_VARIABLE_PATTERNS.sizes.base).toBe("--ig-size");
		expect(CSS_VARIABLE_PATTERNS.sizes.small).toBe("--ig-size-small");
		expect(CSS_VARIABLE_PATTERNS.sizes.medium).toBe("--ig-size-medium");
		expect(CSS_VARIABLE_PATTERNS.sizes.large).toBe("--ig-size-large");
	});

	it("has correct spacing and roundness variables", () => {
		expect(CSS_VARIABLE_PATTERNS.spacing.base).toBe("--ig-spacing");
		expect(CSS_VARIABLE_PATTERNS.spacing.inline).toBe("--ig-spacing-inline");
		expect(CSS_VARIABLE_PATTERNS.spacing.block).toBe("--ig-spacing-block");
		expect(CSS_VARIABLE_PATTERNS.roundness).toBe("--ig-radius-factor");
	});

	it("has correct scrollbar variables", () => {
		expect(CSS_VARIABLE_PATTERNS.scrollbar.size).toBe("--ig-scrollbar-size");
		expect(CSS_VARIABLE_PATTERNS.scrollbar.thumbBackground).toBe(
			"--ig-scrollbar-thumb-background",
		);
		expect(CSS_VARIABLE_PATTERNS.scrollbar.trackBackground).toBe(
			"--ig-scrollbar-track-background",
		);
	});

	it("has correct patterns for color and elevation", () => {
		expect(CSS_VARIABLE_PATTERNS.colorPattern).toBe("--ig-{color}-{shade}");
		expect(CSS_VARIABLE_PATTERNS.elevationPattern).toBe(
			"--ig-elevation-{level}",
		);
	});
});

describe("VARIABLE_PATTERNS", () => {
	it("generates correct palette preset variable", () => {
		expect(VARIABLE_PATTERNS.palettePreset("light", "material")).toBe(
			"$light-material-palette",
		);
		expect(VARIABLE_PATTERNS.palettePreset("dark", "indigo")).toBe(
			"$dark-indigo-palette",
		);
	});

	it("generates correct schema variable", () => {
		expect(VARIABLE_PATTERNS.schema("light", "material")).toBe(
			"$light-material-schema",
		);
		expect(VARIABLE_PATTERNS.schema("dark", "fluent")).toBe(
			"$dark-fluent-schema",
		);
	});

	it("generates correct typeface variable", () => {
		expect(VARIABLE_PATTERNS.typeface("material")).toBe("$material-typeface");
		expect(VARIABLE_PATTERNS.typeface("indigo")).toBe("$indigo-typeface");
	});

	it("generates correct type scale variable", () => {
		expect(VARIABLE_PATTERNS.typeScale("material")).toBe(
			"$material-type-scale",
		);
		expect(VARIABLE_PATTERNS.typeScale("bootstrap")).toBe(
			"$bootstrap-type-scale",
		);
	});

	it("generates correct elevations variable", () => {
		expect(VARIABLE_PATTERNS.elevations("material")).toBe(
			"$material-elevations",
		);
		expect(VARIABLE_PATTERNS.elevations("indigo")).toBe("$indigo-elevations");
	});

	it("generates correct custom palette variable", () => {
		expect(VARIABLE_PATTERNS.customPalette("brand", "light")).toBe(
			"$brand-light-palette",
		);
		expect(VARIABLE_PATTERNS.customPalette("company", "dark")).toBe(
			"$company-dark-palette",
		);
	});
});

describe("generateUseStatement", () => {
	it("generates Angular use statement with double quotes", () => {
		const result = generateUseStatement("angular");
		expect(result).toBe('@use "igniteui-angular/theming" as *;');
	});

	it("generates Web Components use statement with single quotes", () => {
		const result = generateUseStatement("webcomponents");
		expect(result).toBe("@use 'igniteui-theming' as *;");
	});

	it("generates default use statement when platform is undefined", () => {
		const result = generateUseStatement();
		expect(result).toBe("@use 'igniteui-theming' as *;");
	});
});

describe("getElevationsVariable", () => {
	it("returns material elevations for material design system", () => {
		expect(getElevationsVariable("material")).toBe("$material-elevations");
	});

	it("returns indigo elevations for indigo design system", () => {
		expect(getElevationsVariable("indigo")).toBe("$indigo-elevations");
	});

	it("returns material elevations for bootstrap (fallback)", () => {
		expect(getElevationsVariable("bootstrap")).toBe("$material-elevations");
	});

	it("returns material elevations for fluent (fallback)", () => {
		expect(getElevationsVariable("fluent")).toBe("$material-elevations");
	});
});

describe("isMixinSupported", () => {
	describe("core mixin", () => {
		it("is supported for angular", () => {
			expect(isMixinSupported("core", "angular")).toBe(true);
		});

		it("is not supported for webcomponents", () => {
			expect(isMixinSupported("core", "webcomponents")).toBe(false);
		});

		it("is not supported when platform is undefined", () => {
			expect(isMixinSupported("core")).toBe(false);
		});
	});

	describe("theme mixin", () => {
		it("is supported for angular", () => {
			expect(isMixinSupported("theme", "angular")).toBe(true);
		});

		it("is not supported for webcomponents", () => {
			expect(isMixinSupported("theme", "webcomponents")).toBe(false);
		});
	});

	describe("spacing mixin", () => {
		it("is supported for webcomponents", () => {
			expect(isMixinSupported("spacing", "webcomponents")).toBe(true);
		});

		it("is not supported for angular", () => {
			expect(isMixinSupported("spacing", "angular")).toBe(false);
		});

		it("is supported when platform is undefined (generic output)", () => {
			expect(isMixinSupported("spacing")).toBe(true);
		});
	});
});

describe("getPaletteColorGroups", () => {
	it("returns all palette color groups", () => {
		const groups = getPaletteColorGroups();
		expect(groups).toContain("primary");
		expect(groups).toContain("secondary");
		expect(groups).toContain("gray");
		expect(groups).toContain("surface");
		expect(groups).toContain("info");
		expect(groups).toContain("success");
		expect(groups).toContain("warn");
		expect(groups).toContain("error");
		expect(groups).toHaveLength(8);
	});
});
