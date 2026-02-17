/**
 * Platform-specific knowledge for theme generation
 *
 * This module exports platform-specific configurations and generators
 * for all supported Ignite UI platforms:
 * - Ignite UI for Angular
 * - Ignite UI for Web Components
 * - Ignite UI for React
 * - Ignite UI for Blazor
 *
 * It also provides platform detection functionality with multi-signal analysis
 * for automatic platform identification from project files.
 */

import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {Platform} from '../../utils/types.js';

// Re-export Platform type from canonical source
export type {Platform} from '../../utils/types.js';
// Angular platform
export {
  ANGULAR_PLATFORM,
  ANGULAR_USAGE_EXAMPLES,
  type AngularThemeTemplate,
  type CoreMixinOptions,
  generateAngularThemeSass,
  type ThemeMixinOptions,
} from './angular.js';
// Blazor platform
export {BLAZOR_PLATFORM, BLAZOR_USAGE_EXAMPLES} from './blazor.js';
// React platform
export {REACT_PLATFORM, REACT_USAGE_EXAMPLES} from './react.js';
// Web Components platform
export {
  // Helper functions for testability and reuse
  generateWCHeader,
  generateWCImports,
  generateWCProgressProperties,
  generateWCRootVariables,
  generateWCRtlSupport,
  generateWCScrollbarCustomization,
  generateWCThemingMixins,
  generateWebComponentsThemeSass,
  getWCElevationPreset,
  WEBCOMPONENTS_PLATFORM,
  WEBCOMPONENTS_RUNTIME_CONFIG,
  WEBCOMPONENTS_USAGE_EXAMPLES,
  type WebComponentsThemeTemplate,
} from './webcomponents.js';

// ============================================================================
// PLATFORM DETECTION TYPES
// ============================================================================

/**
 * Detection signal from package analysis
 */
export interface PackageDetectionSignal {
  type: 'ignite_package';
  package: string;
  confidence: number;
}

/**
 * Detection signal from config file analysis
 */
export interface ConfigFileDetectionSignal {
  type: 'config_file';
  file: string;
  confidence: number;
}

/**
 * Detection signal from framework package (fallback)
 */
export interface FrameworkDetectionSignal {
  type: 'framework_package';
  package: string;
  confidence: number;
}

/**
 * Union type for all detection signals
 */
export type DetectionSignal = PackageDetectionSignal | ConfigFileDetectionSignal | FrameworkDetectionSignal;

/**
 * Alternative platform detected during ambiguous detection
 */
export interface PlatformAlternative {
  platform: Platform;
  confidence: number;
  signals: DetectionSignal[];
}

/**
 * Platform detection result with enhanced ambiguity handling
 */
export interface PlatformDetectionResult {
  /** Detected platform (null if ambiguous or not detected) */
  platform: Platform | null;
  /** Overall confidence level */
  confidence: 'high' | 'medium' | 'low' | 'none';
  /** True when multiple platforms detected with similar confidence */
  ambiguous?: boolean;
  /** Alternative platforms when ambiguous */
  alternatives?: PlatformAlternative[];
  /** All detection signals found */
  signals: DetectionSignal[];
  /** Human-readable reason for the detection result */
  reason: string;
  /** Primary detected package (for backward compatibility) */
  detectedPackage?: string;
}

// ============================================================================
// PACKAGE DETECTION PATTERNS
// ============================================================================

/**
 * Ignite UI package patterns for each platform.
 * These are HIGH confidence indicators (100).
 */
const IGNITE_PACKAGE_PATTERNS: Record<Platform, string[]> = {
  angular: ['igniteui-angular', '@infragistics/igniteui-angular'],
  webcomponents: ['igniteui-webcomponents', '@infragistics/igniteui-webcomponents'],
  react: ['igniteui-react', '@infragistics/igniteui-react'],
  blazor: [], // Blazor uses NuGet, not npm - detected via .csproj
};

/**
 * Framework package patterns for fallback detection.
 * These are LOW confidence indicators (40) - only used when no Ignite UI package found.
 */
const FRAMEWORK_PACKAGE_PATTERNS: Record<string, Platform> = {
  '@angular/core': 'angular',
  lit: 'webcomponents',
  react: 'react',
  'react-dom': 'react',
};

// ============================================================================
// CONFIG FILE DETECTION
// ============================================================================

/**
 * Internal interface for config file detection results
 */
interface ConfigFileSignal {
  platform: Platform;
  file: string;
  confidence: number;
}

/**
 * Detect platform from config files in the project root.
 * Fast detection that only checks root directory, no deep scanning.
 *
 * @param projectRoot - Path to the project root directory
 * @returns Array of detected config file signals
 */
export function detectConfigFiles(projectRoot = '.'): ConfigFileSignal[] {
  const signals: ConfigFileSignal[] = [];
  const root = resolve(projectRoot);

  // Angular: angular.json (HIGH-MEDIUM confidence)
  if (existsSync(resolve(root, 'angular.json'))) {
    signals.push({platform: 'angular', file: 'angular.json', confidence: 80});
  }

  // React: vite.config.* with React plugin
  for (const viteConfig of ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs']) {
    const configPath = resolve(root, viteConfig);
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        // Check for React plugin in Vite config
        if (content.includes('@vitejs/plugin-react') || content.includes('plugin-react')) {
          signals.push({platform: 'react', file: viteConfig, confidence: 80});
          break;
        }
      } catch {
        // Ignore read errors, continue with other checks
      }
    }
  }

  // React: next.config.* (Next.js is React-specific)
  for (const nextConfig of ['next.config.js', 'next.config.mjs', 'next.config.ts']) {
    if (existsSync(resolve(root, nextConfig))) {
      signals.push({platform: 'react', file: nextConfig, confidence: 80});
      break;
    }
  }

  // Blazor: *.csproj with IgniteUI.Blazor reference (HIGH confidence)
  try {
    const files = readdirSync(root);
    const csprojFiles = files.filter((f) => f.endsWith('.csproj')).slice(0, 5); // Limit to first 5

    for (const csproj of csprojFiles) {
      try {
        const content = readFileSync(resolve(root, csproj), 'utf-8');
        if (content.includes('IgniteUI.Blazor')) {
          signals.push({platform: 'blazor', file: csproj, confidence: 100});
          break;
        }
        // Also check for Blazor SDK without Ignite UI (lower confidence)
        if (content.includes('Microsoft.NET.Sdk.BlazorWebAssembly') || content.includes('Microsoft.NET.Sdk.Razor')) {
          signals.push({platform: 'blazor', file: csproj, confidence: 40});
          break;
        }
      } catch {
        // Ignore read errors for individual files
      }
    }
  } catch {
    // Ignore directory read errors
  }

  return signals;
}

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Detect platform from package.json dependencies and project config files.
 *
 * Uses a multi-signal approach with confidence scoring:
 * 1. Ignite UI packages (HIGH - 100): Definitive platform match
 * 2. Config files (MEDIUM-HIGH - 80): Strong platform indicator
 * 3. Framework packages (LOW - 40): Fallback when no Ignite UI found
 *
 * When multiple platforms are detected with significant confidence (≥60),
 * returns an ambiguous result asking the user to specify explicitly.
 *
 * @param dependencies - package.json dependencies
 * @param devDependencies - package.json devDependencies
 * @param projectRoot - Project root directory for config file detection
 * @returns Platform detection result with signals and confidence
 */
export function detectPlatformFromDependencies(
  dependencies: Record<string, string> = {},
  devDependencies: Record<string, string> = {},
  projectRoot = '.'
): PlatformDetectionResult {
  const allDeps = {...dependencies, ...devDependencies};
  const signals: DetectionSignal[] = [];
  const platformScores = new Map<Platform, number>();

  // STEP 1: Check for Ignite UI packages (HIGH confidence - 100)
  for (const [platform, patterns] of Object.entries(IGNITE_PACKAGE_PATTERNS) as [Platform, string[]][]) {
    for (const pattern of patterns) {
      if (pattern in allDeps) {
        signals.push({
          type: 'ignite_package',
          package: pattern,
          confidence: 100,
        });
        const current = platformScores.get(platform) || 0;
        platformScores.set(platform, Math.max(current, 100));
      }
    }
  }

  // STEP 2: Check config files (MEDIUM-HIGH confidence - 80, or 100 for Blazor with IgniteUI)
  const configSignals = detectConfigFiles(projectRoot);
  for (const signal of configSignals) {
    signals.push({
      type: 'config_file',
      file: signal.file,
      confidence: signal.confidence,
    });
    const current = platformScores.get(signal.platform) || 0;
    platformScores.set(signal.platform, Math.max(current, signal.confidence));
  }

  // STEP 3: Check framework packages (LOW confidence - 40)
  // Only add if we don't already have a high-confidence signal for this platform
  for (const [pkg, platform] of Object.entries(FRAMEWORK_PACKAGE_PATTERNS)) {
    if (pkg in allDeps) {
      const currentScore = platformScores.get(platform) || 0;
      if (currentScore < 60) {
        // Only use framework fallback if no better signal exists
        signals.push({
          type: 'framework_package',
          package: pkg,
          confidence: 40,
        });
        platformScores.set(platform, Math.max(currentScore, 40));
      }
    }
  }

  // STEP 4: Analyze results
  if (platformScores.size === 0) {
    return {
      platform: null,
      confidence: 'none',
      signals: [],
      reason: 'No Ignite UI packages, framework packages, or config files detected',
    };
  }

  // Sort platforms by score (highest first)
  const sorted = Array.from(platformScores.entries()).sort((a, b) => b[1] - a[1]);
  const [topPlatform, topScore] = sorted[0];

  // Check for ambiguous case (multiple platforms with significant scores)
  const ambiguousThreshold = 60;
  const significantPlatforms = sorted.filter(([, score]) => score >= ambiguousThreshold);

  if (significantPlatforms.length > 1) {
    // Build alternatives array with their signals
    const alternatives: PlatformAlternative[] = significantPlatforms.map(([platform, score]) => {
      const platformSignals = signals.filter((s) => {
        if (s.type === 'ignite_package') {
          return IGNITE_PACKAGE_PATTERNS[platform]?.includes(s.package);
        }
        if (s.type === 'config_file') {
          return configSignals.some((cs) => cs.platform === platform && cs.file === s.file);
        }
        if (s.type === 'framework_package') {
          return FRAMEWORK_PACKAGE_PATTERNS[s.package] === platform;
        }
        return false;
      });

      return {
        platform,
        confidence: score,
        signals: platformSignals,
      };
    });

    return {
      platform: null,
      confidence: 'none',
      ambiguous: true,
      alternatives,
      signals,
      reason: `Multiple platforms detected: ${alternatives.map((a) => a.platform).join(', ')}. Please specify platform explicitly.`,
    };
  }

  // Single platform detected - determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low';
  if (topScore >= 80) {
    confidenceLevel = 'high';
  } else if (topScore >= 60) {
    confidenceLevel = 'medium';
  } else {
    confidenceLevel = 'low';
  }

  // Find the detected package for backward compatibility
  const detectedPackageSignal = signals.find(
    (s) => s.type === 'ignite_package' && IGNITE_PACKAGE_PATTERNS[topPlatform]?.includes(s.package)
  ) as PackageDetectionSignal | undefined;

  return {
    platform: topPlatform,
    confidence: confidenceLevel,
    signals,
    detectedPackage: detectedPackageSignal?.package,
    reason: `Detected ${topPlatform} with ${confidenceLevel} confidence (score: ${topScore})`,
  };
}

// ============================================================================
// PLATFORM METADATA
// ============================================================================

/**
 * CSS variable prefix for each platform.
 * Angular uses 'igx-' prefix, all other platforms use 'ig-' prefix.
 */
export const PLATFORM_VARIABLE_PREFIX: Record<Platform, string> = {
  angular: 'igx',
  webcomponents: 'ig',
  react: 'ig',
  blazor: 'ig',
};

/**
 * Get the CSS variable prefix for a given platform
 * @param platform - The platform to get the prefix for
 * @returns The CSS variable prefix (e.g., 'igx' for Angular, 'ig' for others)
 */
export function getVariablePrefix(platform: Platform): string {
  return PLATFORM_VARIABLE_PREFIX[platform];
}

/**
 * Determine if a detected package is a licensed @infragistics package.
 * Only applies to Angular - other platforms always use the free igniteui-theming package.
 *
 * @param detectedPackage - The package name detected from package.json
 * @returns True if the package is a licensed @infragistics package
 */
export function isLicensedPackage(detectedPackage?: string): boolean {
  return detectedPackage?.startsWith('@infragistics/') ?? false;
}

/**
 * Platform metadata for display purposes
 */
export const PLATFORM_METADATA = {
  angular: {
    id: 'angular',
    name: 'Ignite UI for Angular',
    shortName: 'Angular',
    packageName: 'igniteui-angular',
    licensedPackageName: '@infragistics/igniteui-angular',
    themingModule: 'igniteui-angular/theming',
    licensedThemingModule: '@infragistics/igniteui-angular/theming',
    description:
      'Uses core() and theme() mixins from igniteui-angular/theming module. Requires ig-typography CSS class on root element. Available as OSS (igniteui-angular) or licensed (@infragistics/igniteui-angular) package.',
  },
  webcomponents: {
    id: 'webcomponents',
    name: 'Ignite UI for Web Components',
    shortName: 'Web Components',
    packageName: 'igniteui-webcomponents',
    themingModule: 'igniteui-theming',
    description:
      'Uses igniteui-theming directly with palette(), typography(), and elevations() mixins. Supports runtime theme switching via configureTheme(). The igniteui-theming package is always free/OSS.',
  },
  react: {
    id: 'react',
    name: 'Ignite UI for React',
    shortName: 'React',
    packageName: 'igniteui-react',
    themingModule: 'igniteui-theming',
    description:
      'Uses igniteui-theming directly with palette(), typography(), and elevations() mixins. Common with Vite or Next.js projects. The igniteui-theming package is always free/OSS.',
  },
  blazor: {
    id: 'blazor',
    name: 'Ignite UI for Blazor',
    shortName: 'Blazor',
    packageName: 'IgniteUI.Blazor',
    themingModule: 'igniteui-theming',
    description:
      'Uses igniteui-theming for Sass compilation in .NET Blazor projects. Theme styles are compiled to CSS and referenced in Blazor components. The igniteui-theming package is always free/OSS.',
  },
} as const;
