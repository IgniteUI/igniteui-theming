/**
 * Tests for component-metadata.ts knowledge base
 *
 * These tests verify:
 * 1. COMPONENT_METADATA unified data structure (selectors, variants, compound info)
 * 2. Accessor function behavior
 * 3. Structural invariants (inline scope derivation, childScopes validity, etc.)
 * 4. TokenDerivation format validation
 */

import {describe, expect, it} from 'vitest';
import {
  COMPONENT_METADATA,
  getComponentPlatformAvailability,
  getComponentSelector,
  getComponentsForPlatform,
  getCompoundComponentInfo,
  getTokenDerivationsForChild,
  getVariants,
  hasVariants,
  isComponentAvailable,
  isCompoundComponent,
  isVariantTheme,
  VARIANT_THEME_NAMES,
} from '../../knowledge/component-metadata.js';

const VALID_TRANSFORMS = ['identity', 'adaptive-contrast', 'dynamic-shade'];

describe('Component Metadata Knowledge Base', () => {
  // ===== Data Structure Sanity Checks =====

  describe('COMPONENT_METADATA data structure', () => {
    it('should be a non-empty object', () => {
      expect(COMPONENT_METADATA).toBeDefined();
      expect(typeof COMPONENT_METADATA).toBe('object');
      expect(Object.keys(COMPONENT_METADATA).length).toBeGreaterThan(0);
    });

    it('each entry should have a selectors object with angular and webcomponents properties', () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        expect(metadata, `${name} should have selectors`).toHaveProperty('selectors');
        expect(metadata.selectors, `${name}.selectors should have angular property`).toHaveProperty('angular');
        expect(metadata.selectors, `${name}.selectors should have webcomponents property`).toHaveProperty(
          'webcomponents'
        );
      }
    });

    it('selectors should be strings, arrays of strings, or null', () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        const {angular, webcomponents} = metadata.selectors;
        const angularIsValid =
          angular === null ||
          typeof angular === 'string' ||
          (Array.isArray(angular) && angular.every((s) => typeof s === 'string'));
        const webcomponentsIsValid =
          webcomponents === null ||
          typeof webcomponents === 'string' ||
          (Array.isArray(webcomponents) && webcomponents.every((s) => typeof s === 'string'));

        expect(angularIsValid, `${name}.selectors.angular should be string, string[], or null`).toBe(true);
        expect(webcomponentsIsValid, `${name}.selectors.webcomponents should be string, string[], or null`).toBe(true);
      }
    });
  });

  // ===== Variant Structure Tests =====

  describe('variants structure', () => {
    it('components with variants should have non-empty string arrays', () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (metadata.variants) {
          expect(Array.isArray(metadata.variants), `${name}.variants should be an array`).toBe(true);
          expect(metadata.variants.length, `${name}.variants should be non-empty`).toBeGreaterThan(0);
          for (const variant of metadata.variants) {
            expect(typeof variant, `${name} variant should be a string`).toBe('string');
          }
        }
      }
    });

    it('each variant name should also exist as a component in COMPONENT_METADATA', () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (metadata.variants) {
          for (const variant of metadata.variants) {
            expect(
              COMPONENT_METADATA,
              `variant '${variant}' of '${name}' should exist in COMPONENT_METADATA`
            ).toHaveProperty(variant);
          }
        }
      }
    });
  });

  // ===== Compound Structure Tests =====

  describe('compound components structure', () => {
    it('compound entries should have required fields', () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (metadata.compound) {
          expect(metadata.compound, `${name}.compound should have description`).toHaveProperty('description');
          expect(typeof metadata.compound.description, `${name}.compound.description should be a string`).toBe(
            'string'
          );
          expect(metadata.compound, `${name}.compound should have relatedThemes`).toHaveProperty('relatedThemes');
          expect(
            Array.isArray(metadata.compound.relatedThemes),
            `${name}.compound.relatedThemes should be an array`
          ).toBe(true);
        }
      }
    });

    it('childScopes references should be valid ("inline" or key in additionalScopes)', () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.compound?.childScopes) continue;

        const additionalScopeKeys = Object.keys(metadata.compound.additionalScopes ?? {});

        for (const [childName, scopeTargets] of Object.entries(metadata.compound.childScopes)) {
          if (scopeTargets.angular) {
            expect(
              scopeTargets.angular === 'inline' || additionalScopeKeys.includes(scopeTargets.angular),
              `${name} childScope '${childName}' angular target '${scopeTargets.angular}' should be 'inline' or a key in additionalScopes`
            ).toBe(true);
          }
          if (scopeTargets.webcomponents) {
            expect(
              scopeTargets.webcomponents === 'inline' || additionalScopeKeys.includes(scopeTargets.webcomponents),
              `${name} childScope '${childName}' webcomponents target '${scopeTargets.webcomponents}' should be 'inline' or a key in additionalScopes`
            ).toBe(true);
          }
        }
      }
    });

    it('no inline scope should appear in additionalScopes', () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.compound?.additionalScopes) continue;

        expect(
          metadata.compound.additionalScopes,
          `${name}.compound.additionalScopes should not have an 'inline' key`
        ).not.toHaveProperty('inline');
      }
    });

    it('childScopes children should be listed in relatedThemes', () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.compound?.childScopes) continue;

        for (const childName of Object.keys(metadata.compound.childScopes)) {
          expect(
            metadata.compound.relatedThemes,
            `${name} childScope child '${childName}' should be in relatedThemes`
          ).toContain(childName);
        }
      }
    });
  });

  // ===== Token Derivation Validation =====

  describe('TokenDerivation format validation', () => {
    it('keys should match "childTheme.childToken" pattern', () => {
      for (const [compoundName, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.compound?.tokenDerivations) continue;

        for (const key of Object.keys(metadata.compound.tokenDerivations)) {
          expect(key, `${compoundName} derivation key '${key}' should match 'child.token' pattern`).toMatch(
            /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/
          );
        }
      }
    });

    it('"from" field should match "componentName.tokenName" pattern', () => {
      for (const [compoundName, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.compound?.tokenDerivations) continue;

        for (const [key, derivation] of Object.entries(metadata.compound.tokenDerivations)) {
          expect(
            derivation.from,
            `${compoundName} derivation '${key}' from field '${derivation.from}' should match 'component.token' pattern`
          ).toMatch(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/);
        }
      }
    });

    it('"transform" should be one of the valid values', () => {
      for (const [compoundName, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.compound?.tokenDerivations) continue;

        for (const [key, derivation] of Object.entries(metadata.compound.tokenDerivations)) {
          expect(
            VALID_TRANSFORMS,
            `${compoundName} derivation '${key}' transform '${derivation.transform}' should be valid`
          ).toContain(derivation.transform);
        }
      }
    });

    it('"args" should be an object when present', () => {
      for (const [compoundName, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.compound?.tokenDerivations) continue;

        for (const [key, derivation] of Object.entries(metadata.compound.tokenDerivations)) {
          if (derivation.args !== undefined) {
            expect(typeof derivation.args, `${compoundName} derivation '${key}' args should be an object`).toBe(
              'object'
            );
          }
        }
      }
    });
  });

  // ===== VARIANT_THEME_NAMES Derivation =====

  describe('VARIANT_THEME_NAMES', () => {
    it('should be a non-empty Set', () => {
      expect(VARIANT_THEME_NAMES).toBeDefined();
      expect(VARIANT_THEME_NAMES).toBeInstanceOf(Set);
      expect(VARIANT_THEME_NAMES.size).toBeGreaterThan(0);
    });

    it('should contain exactly the variants from COMPONENT_METADATA', () => {
      const expected = new Set(
        Object.values(COMPONENT_METADATA)
          .filter((m) => m.variants)
          .flatMap((m) => m.variants!)
      );

      expect(VARIANT_THEME_NAMES).toEqual(expected);
    });

    it('should not contain base component names', () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (metadata.variants) {
          expect(VARIANT_THEME_NAMES.has(name), `base component '${name}' should not be in VARIANT_THEME_NAMES`).toBe(
            false
          );
        }
      }
    });
  });

  // ===== Accessor Function Tests =====

  describe('getComponentSelector()', () => {
    it('should always return an array', () => {
      const firstComponent = Object.keys(COMPONENT_METADATA)[0];
      const angularResult = getComponentSelector(firstComponent, 'angular');
      const webcomponentsResult = getComponentSelector(firstComponent, 'webcomponents');

      expect(Array.isArray(angularResult)).toBe(true);
      expect(Array.isArray(webcomponentsResult)).toBe(true);
    });

    it('should return non-empty array for existing components', () => {
      const firstComponent = Object.keys(COMPONENT_METADATA)[0];
      const result = getComponentSelector(firstComponent, 'angular');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown component', () => {
      expect(getComponentSelector('__nonexistent_component__', 'angular')).toEqual([]);
    });

    it('should return empty array for unknown component on webcomponents platform', () => {
      expect(getComponentSelector('__nonexistent_component__', 'webcomponents')).toEqual([]);
    });

    it('should normalize single selector to array', () => {
      const componentWithSingleSelector = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => typeof m.selectors.angular === 'string'
      );

      if (componentWithSingleSelector) {
        const [name] = componentWithSingleSelector;
        const result = getComponentSelector(name, 'angular');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
      }
    });

    it('should preserve array selectors as-is', () => {
      const componentWithArraySelector = Object.entries(COMPONENT_METADATA).find(([, m]) =>
        Array.isArray(m.selectors.angular)
      );

      if (componentWithArraySelector) {
        const [name, m] = componentWithArraySelector;
        const result = getComponentSelector(name, 'angular');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe((m.selectors.angular as string[]).length);
      }
    });
  });

  describe('isComponentAvailable()', () => {
    it('should return true for components available on platform', () => {
      const component = Object.entries(COMPONENT_METADATA).find(([, m]) => m.selectors.angular !== null);
      if (component) {
        expect(isComponentAvailable(component[0], 'angular')).toBe(true);
      }
    });

    it('should return false for components not available on platform', () => {
      const component = Object.entries(COMPONENT_METADATA).find(([, m]) => m.selectors.angular === null);
      if (component) {
        expect(isComponentAvailable(component[0], 'angular')).toBe(false);
      }
    });

    it('should return false for unknown components', () => {
      expect(isComponentAvailable('__nonexistent__', 'angular')).toBe(false);
    });
  });

  describe('getComponentsForPlatform()', () => {
    it('should return non-empty array for angular', () => {
      const result = getComponentsForPlatform('angular');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return non-empty array for webcomponents', () => {
      const result = getComponentsForPlatform('webcomponents');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should only include components available on that platform', () => {
      const angularComponents = getComponentsForPlatform('angular');
      for (const name of angularComponents) {
        expect(COMPONENT_METADATA[name].selectors.angular).not.toBeNull();
      }
    });
  });

  describe('getComponentPlatformAvailability()', () => {
    it('should return availability object for known components', () => {
      const firstComponent = Object.keys(COMPONENT_METADATA)[0];
      const result = getComponentPlatformAvailability(firstComponent);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('angular');
      expect(result).toHaveProperty('webcomponents');
    });

    it('should return undefined for unknown components', () => {
      expect(getComponentPlatformAvailability('__nonexistent__')).toBeUndefined();
    });
  });

  describe('hasVariants()', () => {
    it('should return true for components with variants', () => {
      const variantComponent = Object.entries(COMPONENT_METADATA).find(([, m]) => m.variants);
      if (variantComponent) {
        expect(hasVariants(variantComponent[0])).toBe(true);
      }
    });

    it('should return false for components without variants', () => {
      const nonVariantComponent = Object.entries(COMPONENT_METADATA).find(([, m]) => !m.variants);
      if (nonVariantComponent) {
        expect(hasVariants(nonVariantComponent[0])).toBe(false);
      }
    });

    it('should return false for unknown components', () => {
      expect(hasVariants('__nonexistent_component__')).toBe(false);
    });
  });

  describe('getVariants()', () => {
    it('should return array for components with variants', () => {
      const variantComponent = Object.entries(COMPONENT_METADATA).find(([, m]) => m.variants);
      if (variantComponent) {
        const result = getVariants(variantComponent[0]);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array for components without variants', () => {
      const nonVariantComponent = Object.entries(COMPONENT_METADATA).find(([, m]) => !m.variants);
      if (nonVariantComponent) {
        expect(getVariants(nonVariantComponent[0])).toEqual([]);
      }
    });

    it('should return empty array for unknown components', () => {
      expect(getVariants('__nonexistent_component__')).toEqual([]);
    });
  });

  describe('isVariantTheme()', () => {
    it('should return true for variant theme names', () => {
      const variantComponent = Object.entries(COMPONENT_METADATA).find(([, m]) => m.variants);
      if (variantComponent) {
        const firstVariant = variantComponent[1].variants![0];
        expect(isVariantTheme(firstVariant)).toBe(true);
      }
    });

    it('should return false for base component names', () => {
      const baseComponent = Object.entries(COMPONENT_METADATA).find(([, m]) => m.variants);
      if (baseComponent) {
        expect(isVariantTheme(baseComponent[0])).toBe(false);
      }
    });

    it('should return false for unknown names', () => {
      expect(isVariantTheme('__nonexistent_theme__')).toBe(false);
    });
  });

  describe('getCompoundComponentInfo()', () => {
    it('should return info object for compound components', () => {
      const compoundComponent = Object.entries(COMPONENT_METADATA).find(([, m]) => m.compound);
      if (compoundComponent) {
        const result = getCompoundComponentInfo(compoundComponent[0]);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('relatedThemes');
      }
    });

    it('should return undefined for non-compound components', () => {
      const simpleComponent = Object.entries(COMPONENT_METADATA).find(([, m]) => !m.compound);
      if (simpleComponent) {
        expect(getCompoundComponentInfo(simpleComponent[0])).toBeUndefined();
      }
    });

    it('should return undefined for unknown components', () => {
      expect(getCompoundComponentInfo('__nonexistent_component__')).toBeUndefined();
    });
  });

  describe('isCompoundComponent()', () => {
    it('should return true for compound components', () => {
      const compoundComponent = Object.entries(COMPONENT_METADATA).find(([, m]) => m.compound);
      if (compoundComponent) {
        expect(isCompoundComponent(compoundComponent[0])).toBe(true);
      }
    });

    it('should return false for non-compound components', () => {
      const simpleComponent = Object.entries(COMPONENT_METADATA).find(([, m]) => !m.compound);
      if (simpleComponent) {
        expect(isCompoundComponent(simpleComponent[0])).toBe(false);
      }
    });

    it('should return false for unknown components', () => {
      expect(isCompoundComponent('__nonexistent_component__')).toBe(false);
    });
  });

  describe('getTokenDerivationsForChild()', () => {
    it('should return derivations for a known child theme', () => {
      const withDerivations = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.compound?.tokenDerivations && Object.keys(m.compound.tokenDerivations).length > 0
      );

      if (withDerivations) {
        const [compoundName, metadata] = withDerivations;
        const firstKey = Object.keys(metadata.compound!.tokenDerivations!)[0];
        const childTheme = firstKey.split('.')[0];

        const result = getTokenDerivationsForChild(compoundName, childTheme);
        expect(Object.keys(result).length).toBeGreaterThan(0);

        for (const key of Object.keys(result)) {
          expect(key).not.toContain('.');
        }

        for (const derivation of Object.values(result)) {
          expect(derivation).toHaveProperty('from');
          expect(derivation).toHaveProperty('transform');
          expect(VALID_TRANSFORMS).toContain(derivation.transform);
        }
      }
    });

    it('should return empty object for unknown child theme', () => {
      const firstCompound = Object.entries(COMPONENT_METADATA).find(([, m]) => m.compound);
      if (firstCompound) {
        const result = getTokenDerivationsForChild(firstCompound[0], '__nonexistent_child__');
        expect(result).toEqual({});
      }
    });

    it('should return empty object for unknown compound component', () => {
      expect(getTokenDerivationsForChild('__nonexistent_component__', 'any-child')).toEqual({});
    });

    it('should return empty object for compound without derivations', () => {
      const withoutDerivations = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.compound && !m.compound.tokenDerivations
      );

      if (withoutDerivations) {
        const result = getTokenDerivationsForChild(withoutDerivations[0], 'any-child');
        expect(result).toEqual({});
      }
    });

    it('should only return derivations for the requested child', () => {
      const withMultipleChildren = Object.entries(COMPONENT_METADATA).find(([, m]) => {
        if (!m.compound?.tokenDerivations) return false;
        const prefixes = new Set(Object.keys(m.compound.tokenDerivations).map((k) => k.split('.')[0]));
        return prefixes.size > 1;
      });

      if (withMultipleChildren) {
        const [compoundName, metadata] = withMultipleChildren;
        const allKeys = Object.keys(metadata.compound!.tokenDerivations!);
        const firstChild = allKeys[0].split('.')[0];

        const result = getTokenDerivationsForChild(compoundName, firstChild);

        for (const key of Object.keys(result)) {
          expect(metadata.compound!.tokenDerivations).toHaveProperty(`${firstChild}.${key}`);
        }
      }
    });
  });

  // ===== Production Data Invariants =====

  describe('production data invariants', () => {
    it('should not contain stray or test scope entries', () => {
      const validScopeNames = ['overlay']; // Only known non-inline scope names
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.compound?.additionalScopes) continue;

        for (const scopeName of Object.keys(metadata.compound.additionalScopes)) {
          expect(validScopeNames, `${name} additionalScopes contains unexpected scope '${scopeName}'`).toContain(
            scopeName
          );
        }
      }
    });
  });
});
