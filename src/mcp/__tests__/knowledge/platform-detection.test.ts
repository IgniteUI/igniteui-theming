/**
 * Tests for platform detection functionality
 *
 * Tests cover:
 * - Ignite UI package detection (Angular, Web Components, React)
 * - Config file detection (angular.json, vite.config.*, next.config.*, .csproj)
 * - Framework fallback detection
 * - Ambiguous platform scenarios
 * - Confidence scoring
 */

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {detectPlatformFromDependencies, detectConfigFiles} from '../../knowledge/platforms/index.js';

// Mock fs module
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
  };
});

import {existsSync, readFileSync, readdirSync} from 'node:fs';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockReaddirSync = vi.mocked(readdirSync);

describe('detectPlatformFromDependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no config files exist
    mockExistsSync.mockReturnValue(false);
    mockReaddirSync.mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Angular detection', () => {
    it('detects igniteui-angular package with high confidence', () => {
      const result = detectPlatformFromDependencies({'igniteui-angular': '^18.0.0'}, {});

      expect(result.platform).toBe('angular');
      expect(result.confidence).toBe('high');
      expect(result.detectedPackage).toBe('igniteui-angular');
      expect(result.signals).toContainEqual({
        type: 'ignite_package',
        package: 'igniteui-angular',
        confidence: 100,
      });
    });

    it('detects @infragistics/igniteui-angular commercial package', () => {
      const result = detectPlatformFromDependencies({'@infragistics/igniteui-angular': '^18.0.0'}, {});

      expect(result.platform).toBe('angular');
      expect(result.confidence).toBe('high');
      expect(result.detectedPackage).toBe('@infragistics/igniteui-angular');
    });

    it('detects Angular from devDependencies', () => {
      const result = detectPlatformFromDependencies({}, {'igniteui-angular': '^18.0.0'});

      expect(result.platform).toBe('angular');
      expect(result.confidence).toBe('high');
    });

    it('detects Angular from angular.json config file', () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path).includes('angular.json');
      });

      const result = detectPlatformFromDependencies({}, {}, '/project');

      expect(result.platform).toBe('angular');
      expect(result.confidence).toBe('high'); // 80 rounds to high
      expect(result.signals).toContainEqual({
        type: 'config_file',
        file: 'angular.json',
        confidence: 80,
      });
    });

    it('uses @angular/core as fallback with low confidence', () => {
      const result = detectPlatformFromDependencies({'@angular/core': '^18.0.0'}, {});

      expect(result.platform).toBe('angular');
      expect(result.confidence).toBe('low');
      expect(result.signals).toContainEqual({
        type: 'framework_package',
        package: '@angular/core',
        confidence: 40,
      });
    });
  });

  describe('Web Components detection', () => {
    it('detects igniteui-webcomponents package with high confidence', () => {
      const result = detectPlatformFromDependencies({'igniteui-webcomponents': '^5.0.0'}, {});

      expect(result.platform).toBe('webcomponents');
      expect(result.confidence).toBe('high');
      expect(result.detectedPackage).toBe('igniteui-webcomponents');
    });

    it('detects @infragistics/igniteui-webcomponents commercial package', () => {
      const result = detectPlatformFromDependencies({'@infragistics/igniteui-webcomponents': '^5.0.0'}, {});

      expect(result.platform).toBe('webcomponents');
      expect(result.confidence).toBe('high');
    });

    it('uses lit as fallback with low confidence', () => {
      const result = detectPlatformFromDependencies({lit: '^3.0.0'}, {});

      expect(result.platform).toBe('webcomponents');
      expect(result.confidence).toBe('low');
      expect(result.signals).toContainEqual({
        type: 'framework_package',
        package: 'lit',
        confidence: 40,
      });
    });
  });

  describe('React detection', () => {
    it('detects igniteui-react package with high confidence', () => {
      const result = detectPlatformFromDependencies({'igniteui-react': '^18.0.0'}, {});

      expect(result.platform).toBe('react');
      expect(result.confidence).toBe('high');
      expect(result.detectedPackage).toBe('igniteui-react');
    });

    it('detects @infragistics/igniteui-react commercial package', () => {
      const result = detectPlatformFromDependencies({'@infragistics/igniteui-react': '^18.0.0'}, {});

      expect(result.platform).toBe('react');
      expect(result.confidence).toBe('high');
    });

    it('detects React from vite.config.ts with @vitejs/plugin-react', () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path).includes('vite.config.ts');
      });
      mockReadFileSync.mockReturnValue(`
        import { defineConfig } from 'vite';
        import react from '@vitejs/plugin-react';
        export default defineConfig({ plugins: [react()] });
      `);

      const result = detectPlatformFromDependencies({}, {}, '/project');

      expect(result.platform).toBe('react');
      expect(result.confidence).toBe('high');
      expect(result.signals).toContainEqual({
        type: 'config_file',
        file: 'vite.config.ts',
        confidence: 80,
      });
    });

    it('detects React from next.config.js', () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path).includes('next.config.js');
      });

      const result = detectPlatformFromDependencies({}, {}, '/project');

      expect(result.platform).toBe('react');
      expect(result.confidence).toBe('high');
      expect(result.signals).toContainEqual({
        type: 'config_file',
        file: 'next.config.js',
        confidence: 80,
      });
    });

    it('uses react package as fallback with low confidence', () => {
      const result = detectPlatformFromDependencies({react: '^18.0.0', 'react-dom': '^18.0.0'}, {});

      expect(result.platform).toBe('react');
      expect(result.confidence).toBe('low');
      expect(result.signals).toContainEqual({
        type: 'framework_package',
        package: 'react',
        confidence: 40,
      });
    });
  });

  describe('Blazor detection', () => {
    it('detects Blazor from .csproj with IgniteUI.Blazor reference', () => {
      mockExistsSync.mockReturnValue(false);
      mockReaddirSync.mockReturnValue(['MyApp.csproj'] as unknown as ReturnType<typeof readdirSync>);
      mockReadFileSync.mockReturnValue(`
        <Project Sdk="Microsoft.NET.Sdk.BlazorWebAssembly">
          <ItemGroup>
            <PackageReference Include="IgniteUI.Blazor" Version="24.1.16" />
          </ItemGroup>
        </Project>
      `);

      const result = detectPlatformFromDependencies({}, {}, '/project');

      expect(result.platform).toBe('blazor');
      expect(result.confidence).toBe('high');
      expect(result.signals).toContainEqual({
        type: 'config_file',
        file: 'MyApp.csproj',
        confidence: 100,
      });
    });

    it('detects Blazor SDK without IgniteUI with low confidence', () => {
      mockExistsSync.mockReturnValue(false);
      mockReaddirSync.mockReturnValue(['MyApp.csproj'] as unknown as ReturnType<typeof readdirSync>);
      mockReadFileSync.mockReturnValue(`
        <Project Sdk="Microsoft.NET.Sdk.BlazorWebAssembly">
          <PropertyGroup>
            <TargetFramework>net8.0</TargetFramework>
          </PropertyGroup>
        </Project>
      `);

      const result = detectPlatformFromDependencies({}, {}, '/project');

      expect(result.platform).toBe('blazor');
      expect(result.confidence).toBe('low');
      expect(result.signals).toContainEqual({
        type: 'config_file',
        file: 'MyApp.csproj',
        confidence: 40,
      });
    });
  });

  describe('Ambiguous detection', () => {
    it('returns ambiguous when Angular and React packages both present', () => {
      const result = detectPlatformFromDependencies({
        'igniteui-angular': '^18.0.0',
        'igniteui-react': '^18.0.0',
      }, {});

      expect(result.platform).toBeNull();
      expect(result.ambiguous).toBe(true);
      expect(result.alternatives).toHaveLength(2);
      expect(result.alternatives?.map((a: {platform: string}) => a.platform).sort()).toEqual(['angular', 'react']);
    });

    it('returns ambiguous when angular.json and next.config.js both exist', () => {
      mockExistsSync.mockImplementation((path) => {
        const pathStr = String(path);
        return pathStr.includes('angular.json') || pathStr.includes('next.config.js');
      });

      const result = detectPlatformFromDependencies({}, {}, '/project');

      expect(result.platform).toBeNull();
      expect(result.ambiguous).toBe(true);
      expect(result.alternatives).toHaveLength(2);
    });

    it('provides helpful reason message for ambiguous results', () => {
      const result = detectPlatformFromDependencies({
        'igniteui-angular': '^18.0.0',
        'igniteui-webcomponents': '^5.0.0',
      }, {});

      expect(result.reason).toContain('Multiple platforms detected');
      expect(result.reason).toContain('angular');
      expect(result.reason).toContain('webcomponents');
    });

    it('includes signals for each alternative platform', () => {
      const result = detectPlatformFromDependencies({
        'igniteui-angular': '^18.0.0',
        'igniteui-react': '^18.0.0',
      }, {});

      expect(result.alternatives).toBeDefined();

      const angularAlt = result.alternatives?.find((a: {platform: string}) => a.platform === 'angular');
      expect(angularAlt?.signals).toContainEqual({
        type: 'ignite_package',
        package: 'igniteui-angular',
        confidence: 100,
      });

      const reactAlt = result.alternatives?.find((a: {platform: string}) => a.platform === 'react');
      expect(reactAlt?.signals).toContainEqual({
        type: 'ignite_package',
        package: 'igniteui-react',
        confidence: 100,
      });
    });
  });

  describe('No platform detected', () => {
    it('returns null platform with none confidence when no matches', () => {
      const result = detectPlatformFromDependencies({lodash: '^4.17.0'}, {});

      expect(result.platform).toBeNull();
      expect(result.confidence).toBe('none');
      expect(result.signals).toEqual([]);
      expect(result.reason).toContain('No Ignite UI packages');
    });

    it('returns null platform when dependencies are empty', () => {
      const result = detectPlatformFromDependencies({}, {});

      expect(result.platform).toBeNull();
      expect(result.confidence).toBe('none');
    });
  });

  describe('Signal priority', () => {
    it('prefers Ignite UI package over framework fallback', () => {
      const result = detectPlatformFromDependencies({
        '@angular/core': '^18.0.0',
        'igniteui-angular': '^18.0.0',
      }, {});

      expect(result.platform).toBe('angular');
      expect(result.confidence).toBe('high');
      expect(result.detectedPackage).toBe('igniteui-angular');
      // Should not include framework fallback since we have high confidence
    });

    it('prefers config file over framework fallback', () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path).includes('angular.json');
      });

      const result = detectPlatformFromDependencies({'@angular/core': '^18.0.0'}, {}, '/project');

      expect(result.platform).toBe('angular');
      expect(result.confidence).toBe('high');
      // Config file (80) should override framework fallback (40)
      expect(result.signals).toContainEqual({
        type: 'config_file',
        file: 'angular.json',
        confidence: 80,
      });
    });

    it('combines multiple signals for same platform', () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path).includes('angular.json');
      });

      const result = detectPlatformFromDependencies({'igniteui-angular': '^18.0.0'}, {}, '/project');

      expect(result.platform).toBe('angular');
      expect(result.confidence).toBe('high');
      // Should have both package and config file signals
      expect(result.signals.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('detectConfigFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
    mockReaddirSync.mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects angular.json', () => {
    mockExistsSync.mockImplementation((path) => {
      return String(path).includes('angular.json');
    });

    const signals = detectConfigFiles('/project');

    expect(signals).toContainEqual({
      platform: 'angular',
      file: 'angular.json',
      confidence: 80,
    });
  });

  it('detects vite.config.ts with React plugin', () => {
    mockExistsSync.mockImplementation((path) => {
      return String(path).includes('vite.config.ts');
    });
    mockReadFileSync.mockReturnValue("import react from '@vitejs/plugin-react';");

    const signals = detectConfigFiles('/project');

    expect(signals).toContainEqual({
      platform: 'react',
      file: 'vite.config.ts',
      confidence: 80,
    });
  });

  it('ignores vite.config.ts without React plugin', () => {
    mockExistsSync.mockImplementation((path) => {
      return String(path).includes('vite.config.ts');
    });
    mockReadFileSync.mockReturnValue("import vue from '@vitejs/plugin-vue';");

    const signals = detectConfigFiles('/project');

    expect(signals).not.toContainEqual(expect.objectContaining({platform: 'react'}));
  });

  it('detects next.config.js', () => {
    mockExistsSync.mockImplementation((path) => {
      return String(path).includes('next.config.js');
    });

    const signals = detectConfigFiles('/project');

    expect(signals).toContainEqual({
      platform: 'react',
      file: 'next.config.js',
      confidence: 80,
    });
  });

  it('detects .csproj with IgniteUI.Blazor', () => {
    mockReaddirSync.mockReturnValue(['App.csproj'] as unknown as ReturnType<typeof readdirSync>);
    mockReadFileSync.mockReturnValue('<PackageReference Include="IgniteUI.Blazor" />');

    const signals = detectConfigFiles('/project');

    expect(signals).toContainEqual({
      platform: 'blazor',
      file: 'App.csproj',
      confidence: 100,
    });
  });

  it('limits .csproj scanning to first 5 files', () => {
    mockReaddirSync.mockReturnValue([
      'a.csproj',
      'b.csproj',
      'c.csproj',
      'd.csproj',
      'e.csproj',
      'f.csproj',
      'g.csproj',
    ] as unknown as ReturnType<typeof readdirSync>);
    mockReadFileSync.mockReturnValue('<Project />');

    detectConfigFiles('/project');

    // Should have called readFileSync at most 5 times for csproj files
    const csprojReadCalls = mockReadFileSync.mock.calls.filter((call) => String(call[0]).endsWith('.csproj'));
    expect(csprojReadCalls.length).toBeLessThanOrEqual(5);
  });

  it('handles file read errors gracefully', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Should not throw
    expect(() => detectConfigFiles('/project')).not.toThrow();
  });

  it('handles directory read errors gracefully', () => {
    mockReaddirSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Should not throw
    expect(() => detectConfigFiles('/project')).not.toThrow();
  });

  it('returns empty array when no config files found', () => {
    const signals = detectConfigFiles('/project');

    expect(signals).toEqual([]);
  });
});
