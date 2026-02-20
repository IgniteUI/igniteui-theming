/**
 * Handler for detect_platform tool.
 *
 * Detects the target platform (Angular, Web Components, React, Blazor, or Generic)
 * from package.json dependencies and project config files.
 *
 * Uses a multi-signal detection approach:
 * 1. Ignite UI packages (HIGH confidence)
 * 2. Config files like angular.json, vite.config.ts, etc. (MEDIUM-HIGH confidence)
 * 3. Framework packages as fallback (LOW confidence)
 * 4. Generic (standalone) mode when no Ignite UI product is detected
 *
 * When multiple platforms are detected with significant confidence,
 * returns an ambiguous result prompting user to specify explicitly.
 *
 * When no Ignite UI product is found, returns "generic" platform
 * with tool eligibility guidance and Sass includePaths configuration help.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import {
	type DetectionSignal,
	detectPlatformFromDependencies,
	isLicensedPackage,
	PLATFORM_METADATA,
	type PlatformDetectionResult,
} from "../../knowledge/platforms/index.js";
import type { DetectPlatformParams } from "../schemas.js";

/**
 * Zod schema for validating package.json structure.
 * Only validates the fields we need for platform detection.
 */
const packageJsonSchema = z.object({
	dependencies: z.record(z.string()).optional(),
	devDependencies: z.record(z.string()).optional(),
});

/**
 * Result structure for platform detection (public API).
 */
export interface DetectPlatformResult {
	platform: string | null;
	confidence: "high" | "medium" | "low" | "none";
	ambiguous?: boolean;
	alternatives?: Array<{
		platform: string;
		confidence: number;
		signals: DetectionSignal[];
	}>;
	detectedPackage?: string;
	licensed?: boolean;
	signals?: DetectionSignal[];
	reason: string;
	platformInfo?: {
		name: string;
		packageName: string;
		themingModule: string;
		description: string;
	};
}

/**
 * Format a detection signal for human-readable output.
 */
function formatSignal(signal: DetectionSignal): string {
	switch (signal.type) {
		case "ignite_package":
			return `package: ${signal.package}`;
		case "config_file":
			return `config: ${signal.file}`;
		case "framework_package":
			return `framework: ${signal.package}`;
		default:
			return "unknown";
	}
}

// ============================================================================
// SASS CONFIGURATION GUIDANCE
// ============================================================================

interface SassConfigEntry {
	/** How to match the config file name: exact string or prefix */
	match: "exact" | "prefix";
	/** Key to match against (file name or prefix) */
	key: string;
	/** Human-readable description of what was detected */
	description: string;
	/** Code fence language */
	lang: string;
	/** Code snippet showing how to configure includePaths */
	code: string;
}

/**
 * Lookup table mapping config file patterns to Sass includePaths guidance.
 * Add new entries here when supporting additional build tools.
 */
const SASS_CONFIG_GUIDANCE: SassConfigEntry[] = [
	{
		match: "exact",
		key: "angular.json",
		description:
			"An `angular.json` config file was detected. To use Sass output from this MCP, ensure your Angular project includes `node_modules` in the Sass load paths:",
		lang: "json",
		code: [
			"// In angular.json → architect → build → options:",
			'"stylePreprocessorOptions": {',
			'  "includePaths": ["node_modules"]',
			"}",
		].join("\n"),
	},
	{
		match: "prefix",
		key: "vite.config",
		description:
			"A Vite config file was detected. To use Sass output from this MCP, ensure your Vite config includes `node_modules` in the Sass load paths:",
		lang: "js",
		code: [
			"// In vite.config.ts/js:",
			"css: {",
			"  preprocessorOptions: {",
			"    scss: {",
			"      includePaths: ['node_modules']",
			"    }",
			"  }",
			"}",
		].join("\n"),
	},
	{
		match: "prefix",
		key: "next.config",
		description:
			"A Next.js config file was detected. To use Sass output from this MCP, ensure your Next.js config includes `node_modules` in the Sass load paths:",
		lang: "js",
		code: [
			"// In next.config.js/mjs/ts:",
			"sassOptions: {",
			"  includePaths: ['node_modules']",
			"}",
		].join("\n"),
	},
];

const SASS_CONFIG_FALLBACK =
	"To use Sass output from this MCP, ensure your project's Sass compiler has `node_modules` in its `includePaths` (or `loadPaths`). The exact configuration depends on your build tool. Investigate the project's build configuration to find the right place to add this.";

/**
 * Find Sass configuration guidance for a given config file name.
 */
function findSassGuidance(fileName: string): SassConfigEntry | undefined {
	return SASS_CONFIG_GUIDANCE.find((entry) =>
		entry.match === "exact"
			? fileName === entry.key
			: fileName.startsWith(entry.key),
	);
}

// ============================================================================
// RESPONSE SECTION BUILDERS
// ============================================================================

/**
 * Build the "Available Tools" and "Not Available" sections for generic mode.
 */
function buildToolEligibilitySection(): string[] {
	return [
		"### Available Tools",
		"",
		"The following tools work in generic (standalone) mode:",
		"",
		"- `create_palette` — Generate color palettes",
		"- `create_custom_palette` — Generate fully custom palettes",
		"- `create_typography` — Set up typography/type scales",
		"- `create_elevations` — Configure shadow/elevation system",
		"- `create_theme` — Generate a complete theme",
		"- `set_size` / `set_spacing` / `set_roundness` — Layout tokens (use `scope` with a custom CSS selector or omit for `:root`; do **not** use `component` as it targets Ignite UI component selectors)",
		"- `get_color` — Get CSS variable references for palette colors",
		"- `read_resource` — Read theming reference data",
		"",
		"### Not Available in Generic Mode",
		"",
		"- `create_component_theme` — Requires a specific Ignite UI product platform (angular, webcomponents, react, or blazor) for component selectors and variable prefixes",
		"- `get_component_design_tokens` — Returns tokens for Ignite UI framework components which are not present in generic mode",
		"",
	];
}

/**
 * Build the "Sass Configuration" section based on detected config file signals.
 */
function buildSassConfigSection(signals: DetectionSignal[]): string[] {
	const lines: string[] = ["### Sass Configuration", ""];

	const configFileSignals = signals.filter((s) => s.type === "config_file");

	if (configFileSignals.length === 0) {
		lines.push(SASS_CONFIG_FALLBACK, "");
		return lines;
	}

	for (const signal of configFileSignals) {
		if (signal.type !== "config_file") continue;

		const guidance = findSassGuidance(signal.file);
		if (guidance) {
			lines.push(
				guidance.description,
				"",
				`\`\`\`${guidance.lang}`,
				guidance.code,
				"```",
				"",
			);
		}
	}

	return lines;
}

/**
 * Build the "Output Format Notes" section based on whether igniteui-theming is installed.
 */
function buildOutputFormatNotes(hasThemingPackage: boolean): string[] {
	const lines: string[] = ["### Output Format Notes", ""];

	if (!hasThemingPackage) {
		lines.push(
			"The `igniteui-theming` package was **not found** in this project's dependencies.",
			"",
			"- **CSS output** works without any local installation — the MCP compiles Sass to CSS server-side.",
			"- **Sass output** requires `igniteui-theming` to be resolvable in your project. Run `npm install igniteui-theming` to install it, then configure `includePaths` as described above.",
		);
	} else {
		lines.push(
			"The `igniteui-theming` package is installed in this project.",
			"",
			"- **CSS output** is compiled server-side by the MCP — no Sass toolchain needed.",
			"- **Sass output** uses `@use 'igniteui-theming' as *;` and requires the `includePaths` configuration described above.",
		);
	}

	return lines;
}

// ============================================================================
// RESPONSE BRANCH BUILDERS
// ============================================================================

/**
 * Build response text for ambiguous detection (multiple Ignite UI platforms found).
 */
function buildAmbiguousResponse(result: PlatformDetectionResult): string[] {
	const alternatives = result.alternatives!;
	const lines: string[] = [
		"## Platform Detection Result",
		"",
		"**Status:** Ambiguous - Multiple platforms detected",
		"",
		"The project appears to contain dependencies for multiple Ignite UI platforms. This might be a monorepo or a project transitioning between frameworks.",
		"",
		"### Detected Platforms",
		"",
	];

	for (const alt of alternatives) {
		const metadata =
			PLATFORM_METADATA[alt.platform as keyof typeof PLATFORM_METADATA];
		lines.push(
			`#### ${metadata.name}`,
			`- **Confidence:** ${alt.confidence}%`,
			`- **Signals:** ${alt.signals.map(formatSignal).join(", ")}`,
			`- **Theming module:** \`${metadata.themingModule}\``,
			"",
		);
	}

	lines.push(
		"### Action Required",
		"",
		"Please specify the platform explicitly when calling theme generation tools:",
		"",
	);

	for (const alt of alternatives) {
		const metadata =
			PLATFORM_METADATA[alt.platform as keyof typeof PLATFORM_METADATA];
		lines.push(`- Use \`platform: '${alt.platform}'\` for ${metadata.name}`);
	}

	return lines;
}

/**
 * Build response text for generic (standalone) mode.
 */
function buildGenericResponse(
	result: PlatformDetectionResult,
	hasThemingPackage: boolean,
): string[] {
	const metadata = PLATFORM_METADATA.generic;
	const lines: string[] = [
		"## Platform Detection Result",
		"",
		`**Detected Platform:** ${metadata.name}`,
		`**Confidence:** ${result.confidence}`,
		`**Theming Module:** \`${metadata.themingModule}\``,
		"",
		metadata.description,
		"",
	];

	if (result.signals && result.signals.length > 0) {
		lines.push(
			`**Detection Signals:** ${result.signals.map(formatSignal).join(", ")}`,
			"",
		);
	}

	lines.push(
		...buildToolEligibilitySection(),
		...buildSassConfigSection(result.signals ?? []),
		...buildOutputFormatNotes(hasThemingPackage),
	);

	return lines;
}

/**
 * Build response text for a single detected Ignite UI platform.
 */
function buildPlatformResponse(
	result: PlatformDetectionResult,
	licensed: boolean | undefined,
): string[] {
	const platform = result.platform!;
	const metadata = PLATFORM_METADATA[platform];
	const lines: string[] = [
		"## Platform Detection Result",
		"",
		`**Detected Platform:** ${metadata.name}`,
		`**Confidence:** ${result.confidence}`,
	];

	if (result.detectedPackage) {
		lines.push(`**Detected Package:** ${result.detectedPackage}`);
		if (platform === "angular") {
			const isLicensed = isLicensedPackage(result.detectedPackage);
			lines.push(
				`**Package Type:** ${isLicensed ? "Licensed (@infragistics)" : "Open Source (npm)"}`,
			);
		}
	}

	if (result.signals && result.signals.length > 0) {
		lines.push(
			`**Detection Signals:** ${result.signals.map(formatSignal).join(", ")}`,
		);
	}

	const themingModule =
		platform === "angular" && licensed
			? (metadata as any).licensedThemingModule
			: metadata.themingModule;
	lines.push(`**Theming Module:** \`${themingModule}\``, "");

	let usageLine = `When generating theme code, use \`platform: '${platform}'\``;
	if (platform === "angular" && licensed) {
		usageLine += " and `licensed: true`";
	}
	usageLine +=
		" to ensure the correct Sass syntax is generated for this platform.";

	lines.push("### Usage", "", usageLine, "", metadata.description);

	if (result.confidence === "low") {
		lines.push(
			"",
			"### Note",
			"",
			"Detection confidence is **low**. This means no Ignite UI package was found, only framework packages. Please verify this is the correct platform before generating themes.",
		);
	} else if (result.confidence === "medium") {
		lines.push(
			"",
			"### Note",
			"",
			"Detection confidence is **medium**. Consider verifying the platform if the generated code doesn't work as expected.",
		);
	}

	return lines;
}

/**
 * Build response text when no platform could be determined (error/null state).
 */
function buildNullPlatformResponse(result: PlatformDetectionResult): string[] {
	return [
		"## Platform Detection Result",
		"",
		"**Platform:** Not detected",
		`**Reason:** ${result.reason}`,
		"",
		"### Recommendation",
		"",
		"Please specify the platform explicitly when calling theme generation tools:",
		"",
		"- Use `platform: 'angular'` for Ignite UI for Angular",
		"- Use `platform: 'webcomponents'` for Ignite UI for Web Components",
		"- Use `platform: 'react'` for Ignite UI for React",
		"- Use `platform: 'blazor'` for Ignite UI for Blazor",
		"- Use `platform: 'generic'` for platform-agnostic output",
	];
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Handle the detect_platform tool invocation.
 */
export async function handleDetectPlatform(params: DetectPlatformParams) {
	const packageJsonPath = params.packageJsonPath ?? "./package.json";
	const resolvedPath = resolve(process.cwd(), packageJsonPath);
	const projectRoot = dirname(resolvedPath);

	let result: PlatformDetectionResult;
	let parsedDeps: Record<string, string> = {};
	let parsedDevDeps: Record<string, string> = {};

	try {
		const packageJsonContent = await readFile(resolvedPath, "utf-8");
		const parseResult = packageJsonSchema.safeParse(
			JSON.parse(packageJsonContent),
		);

		if (!parseResult.success) {
			result = {
				platform: null,
				confidence: "none",
				signals: [],
				reason: `Invalid package.json structure: ${parseResult.error.message}`,
			};
		} else {
			const packageJson = parseResult.data;
			parsedDeps = packageJson.dependencies ?? {};
			parsedDevDeps = packageJson.devDependencies ?? {};
			result = detectPlatformFromDependencies(
				parsedDeps,
				parsedDevDeps,
				projectRoot,
			);
		}
	} catch (error) {
		// File not found or invalid JSON
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		result = {
			platform: null,
			confidence: "none",
			signals: [],
			reason: `Could not read package.json: ${errorMessage}`,
		};
	}

	const allDeps = { ...parsedDeps, ...parsedDevDeps };
	const hasThemingPackage = "igniteui-theming" in allDeps;

	// Build the structured response
	const response: DetectPlatformResult = {
		platform: result.platform,
		confidence: result.confidence,
		reason: result.reason,
		signals: result.signals,
	};

	if (result.ambiguous && result.alternatives) {
		response.ambiguous = true;
		response.alternatives = result.alternatives;
	}

	if (result.detectedPackage) {
		response.detectedPackage = result.detectedPackage;
		response.licensed = isLicensedPackage(result.detectedPackage);
	}

	if (result.platform) {
		const metadata = PLATFORM_METADATA[result.platform];
		response.platformInfo = {
			name: metadata.name,
			packageName: metadata.packageName,
			themingModule: metadata.themingModule,
			description: metadata.description,
		};
	}

	// Build the response text
	const lines =
		result.ambiguous && result.alternatives
			? buildAmbiguousResponse(result)
			: result.platform === "generic"
				? buildGenericResponse(result, hasThemingPackage)
				: result.platform
					? buildPlatformResponse(result, response.licensed)
					: buildNullPlatformResponse(result);

	return {
		content: [
			{
				type: "text" as const,
				text: lines.join("\n"),
			},
		],
		structuredData: response,
	};
}
