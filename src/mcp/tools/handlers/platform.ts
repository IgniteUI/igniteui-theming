/**
 * Handler for detect_platform tool.
 *
 * Detects the target platform (Angular, Web Components, React, or Blazor)
 * from package.json dependencies and project config files.
 *
 * Uses a multi-signal detection approach:
 * 1. Ignite UI packages (HIGH confidence)
 * 2. Config files like angular.json, vite.config.ts, etc. (MEDIUM-HIGH confidence)
 * 3. Framework packages as fallback (LOW confidence)
 *
 * When multiple platforms are detected with significant confidence,
 * returns an ambiguous result prompting user to specify explicitly.
 */

import {readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {z} from 'zod';
import {
  detectPlatformFromDependencies,
  isLicensedPackage,
  PLATFORM_METADATA,
  type PlatformDetectionResult,
  type DetectionSignal,
} from '../../knowledge/index.js';
import type {DetectPlatformParams} from '../schemas.js';

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
  confidence: 'high' | 'medium' | 'low' | 'none';
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
    case 'ignite_package':
      return `package: ${signal.package}`;
    case 'config_file':
      return `config: ${signal.file}`;
    case 'framework_package':
      return `framework: ${signal.package}`;
    default:
      return 'unknown';
  }
}

/**
 * Handle the detect_platform tool invocation.
 */
export async function handleDetectPlatform(params: DetectPlatformParams) {
  const packageJsonPath = params.packageJsonPath ?? './package.json';
  const resolvedPath = resolve(process.cwd(), packageJsonPath);
  const projectRoot = dirname(resolvedPath);

  let result: PlatformDetectionResult;

  try {
    const packageJsonContent = await readFile(resolvedPath, 'utf-8');
    const parseResult = packageJsonSchema.safeParse(JSON.parse(packageJsonContent));

    if (!parseResult.success) {
      result = {
        platform: null,
        confidence: 'none',
        signals: [],
        reason: `Invalid package.json structure: ${parseResult.error.message}`,
      };
    } else {
      const packageJson = parseResult.data;
      result = detectPlatformFromDependencies(packageJson.dependencies, packageJson.devDependencies, projectRoot);
    }
  } catch (error) {
    // File not found or invalid JSON
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result = {
      platform: null,
      confidence: 'none',
      signals: [],
      reason: `Could not read package.json: ${errorMessage}`,
    };
  }

  // Build the response
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
    // Determine if licensed package (only relevant for Angular)
    response.licensed = isLicensedPackage(result.detectedPackage);
  }

  // Add platform info if detected
  if (result.platform) {
    const metadata = PLATFORM_METADATA[result.platform];
    response.platformInfo = {
      name: metadata.name,
      packageName: metadata.packageName,
      themingModule: metadata.themingModule,
      description: metadata.description,
    };
  }

  // Format the response text for MCP
  let text: string;

  if (result.ambiguous && result.alternatives) {
    // AMBIGUOUS CASE: Multiple platforms detected
    text = `## Platform Detection Result\n\n`;
    text += `**Status:** Ambiguous - Multiple platforms detected\n\n`;
    text += `The project appears to contain dependencies for multiple Ignite UI platforms. `;
    text += `This might be a monorepo or a project transitioning between frameworks.\n\n`;
    text += `### Detected Platforms\n\n`;

    for (const alt of result.alternatives) {
      const metadata = PLATFORM_METADATA[alt.platform as keyof typeof PLATFORM_METADATA];
      text += `#### ${metadata.name}\n`;
      text += `- **Confidence:** ${alt.confidence}%\n`;
      text += `- **Signals:** ${alt.signals.map(formatSignal).join(', ')}\n`;
      text += `- **Theming module:** \`${metadata.themingModule}\`\n\n`;
    }

    text += `### Action Required\n\n`;
    text += `Please specify the platform explicitly when calling theme generation tools:\n\n`;
    for (const alt of result.alternatives) {
      const metadata = PLATFORM_METADATA[alt.platform as keyof typeof PLATFORM_METADATA];
      text += `- Use \`platform: '${alt.platform}'\` for ${metadata.name}\n`;
    }
  } else if (result.platform) {
    // SINGLE PLATFORM DETECTED
    const metadata = PLATFORM_METADATA[result.platform];
    text = `## Platform Detection Result\n\n`;
    text += `**Detected Platform:** ${metadata.name}\n`;
    text += `**Confidence:** ${result.confidence}\n`;

    if (result.detectedPackage) {
      text += `**Detected Package:** ${result.detectedPackage}\n`;
      const licensed = isLicensedPackage(result.detectedPackage);
      if (result.platform === 'angular') {
        text += `**Package Type:** ${licensed ? 'Licensed (@infragistics)' : 'Open Source (npm)'}\n`;
      }
    }

    if (result.signals && result.signals.length > 0) {
      text += `**Detection Signals:** ${result.signals.map(formatSignal).join(', ')}\n`;
    }

    const themingModule =
      result.platform === 'angular' && response.licensed
        ? (metadata as any).licensedThemingModule
        : metadata.themingModule;
    text += `**Theming Module:** \`${themingModule}\`\n\n`;

    text += `### Usage\n\n`;
    text += `When generating theme code, use \`platform: '${result.platform}'\``;
    if (result.platform === 'angular' && response.licensed) {
      text += ` and \`licensed: true\``;
    }
    text += ` to ensure the correct Sass syntax is generated for this platform.\n\n`;
    text += `${metadata.description}`;

    // Add confidence-specific notes
    if (result.confidence === 'low') {
      text += `\n\n### Note\n\n`;
      text += `Detection confidence is **low**. This means no Ignite UI package was found, `;
      text += `only framework packages. Please verify this is the correct platform before generating themes.`;
    } else if (result.confidence === 'medium') {
      text += `\n\n### Note\n\n`;
      text += `Detection confidence is **medium**. Consider verifying the platform if the generated `;
      text += `code doesn't work as expected.`;
    }
  } else {
    // NO PLATFORM DETECTED
    text = `## Platform Detection Result\n\n`;
    text += `**Platform:** Not detected\n`;
    text += `**Reason:** ${result.reason}\n\n`;
    text += `### Recommendation\n\n`;
    text += `Please specify the platform explicitly when calling theme generation tools:\n\n`;
    text += `- Use \`platform: 'angular'\` for Ignite UI for Angular\n`;
    text += `- Use \`platform: 'webcomponents'\` for Ignite UI for Web Components\n`;
    text += `- Use \`platform: 'react'\` for Ignite UI for React\n`;
    text += `- Use \`platform: 'blazor'\` for Ignite UI for Blazor`;
  }

  return {
    content: [
      {
        type: 'text' as const,
        text,
      },
    ],
    // Also include structured data for programmatic access
    structuredData: response,
  };
}
