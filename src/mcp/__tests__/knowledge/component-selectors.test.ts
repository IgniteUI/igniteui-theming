/**
 * Tests for component-selectors.ts knowledge base
 *
 * These tests verify function behavior using stable test cases that don't
 * depend on specific production data values, making them resilient to data changes.
 */

import {describe, it, expect} from 'vitest';
import {
  COMPONENT_SELECTORS,
  COMPONENT_VARIANTS,
  COMPOUND_COMPONENTS,
  getComponentSelector,
  hasVariants,
  getVariants,
  isVariantTheme,
  getCompoundComponentInfo,
  isCompoundComponent,
  getPartSelector,
  hasPartSelectors,
  getAllPartSelectors,
} from '../../knowledge/component-selectors.js';

describe('Component Selectors Knowledge Base', () => {
  // ===== Data Structure Sanity Checks =====
  // These tests verify the data structures exist and have the expected shape,
  // without asserting on specific values that may change.

  describe('COMPONENT_SELECTORS data structure', () => {
    it('should be a non-empty object', () => {
      expect(COMPONENT_SELECTORS).toBeDefined();
      expect(typeof COMPONENT_SELECTORS).toBe('object');
      expect(Object.keys(COMPONENT_SELECTORS).length).toBeGreaterThan(0);
    });

    it('each entry should have angular and webcomponents properties', () => {
      for (const [name, selector] of Object.entries(COMPONENT_SELECTORS)) {
        expect(selector, `${name} should have angular property`).toHaveProperty('angular');
        expect(selector, `${name} should have webcomponents property`).toHaveProperty('webcomponents');
      }
    });

    it('selectors should be strings, arrays of strings, or null', () => {
      for (const [name, selector] of Object.entries(COMPONENT_SELECTORS)) {
        const angularIsValid =
          selector.angular === null ||
          typeof selector.angular === 'string' ||
          (Array.isArray(selector.angular) && selector.angular.every((s) => typeof s === 'string'));
        const webcomponentsIsValid =
          selector.webcomponents === null ||
          typeof selector.webcomponents === 'string' ||
          (Array.isArray(selector.webcomponents) && selector.webcomponents.every((s) => typeof s === 'string'));

        expect(angularIsValid, `${name}.angular should be string, string[], or null`).toBe(true);
        expect(webcomponentsIsValid, `${name}.webcomponents should be string, string[], or null`).toBe(true);
      }
    });
  });

  describe('COMPONENT_VARIANTS data structure', () => {
    it('should be a non-empty object', () => {
      expect(COMPONENT_VARIANTS).toBeDefined();
      expect(typeof COMPONENT_VARIANTS).toBe('object');
      expect(Object.keys(COMPONENT_VARIANTS).length).toBeGreaterThan(0);
    });

    it('each entry should be an array of strings', () => {
      for (const [name, variants] of Object.entries(COMPONENT_VARIANTS)) {
        expect(Array.isArray(variants), `${name} variants should be an array`).toBe(true);
        for (const variant of variants) {
          expect(typeof variant, `${name} variant should be a string`).toBe('string');
        }
      }
    });
  });

  describe('COMPOUND_COMPONENTS data structure', () => {
    it('should be a non-empty object', () => {
      expect(COMPOUND_COMPONENTS).toBeDefined();
      expect(typeof COMPOUND_COMPONENTS).toBe('object');
      expect(Object.keys(COMPOUND_COMPONENTS).length).toBeGreaterThan(0);
    });

    it('each entry should have description and relatedThemes', () => {
      for (const [name, info] of Object.entries(COMPOUND_COMPONENTS)) {
        expect(info, `${name} should have description`).toHaveProperty('description');
        expect(typeof info.description, `${name}.description should be a string`).toBe('string');
        expect(info, `${name} should have relatedThemes`).toHaveProperty('relatedThemes');
        expect(Array.isArray(info.relatedThemes), `${name}.relatedThemes should be an array`).toBe(true);
      }
    });

    it('innerSelectors keys should match relatedThemes when present', () => {
      for (const [name, info] of Object.entries(COMPOUND_COMPONENTS)) {
        if (info.innerSelectors?.webcomponents) {
          const partsKeys = Object.keys(info.innerSelectors.webcomponents);
          for (const theme of info.relatedThemes) {
            expect(partsKeys, `${name}.innerSelectors.webcomponents should include key for ${theme}`).toContain(theme);
          }
        }
        if (info.innerSelectors?.angular) {
          const angularKeys = Object.keys(info.innerSelectors.angular);
          for (const theme of info.relatedThemes) {
            expect(angularKeys, `${name}.innerSelectors.angular should include key for ${theme}`).toContain(theme);
          }
        }
      }
    });
  });

  // ===== Function Behavior Tests =====
  // These tests verify function logic by testing against any existing data,
  // checking return types and edge cases rather than specific values.

  describe('getComponentSelector()', () => {
    it('should always return an array', () => {
      // Test with a component we know exists
      const firstComponent = Object.keys(COMPONENT_SELECTORS)[0];
      const angularResult = getComponentSelector(firstComponent, 'angular');
      const webcomponentsResult = getComponentSelector(firstComponent, 'webcomponents');

      expect(Array.isArray(angularResult)).toBe(true);
      expect(Array.isArray(webcomponentsResult)).toBe(true);
    });

    it('should return non-empty array for existing components', () => {
      const firstComponent = Object.keys(COMPONENT_SELECTORS)[0];
      const result = getComponentSelector(firstComponent, 'angular');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown component', () => {
      const result = getComponentSelector('__nonexistent_component__', 'angular');
      expect(result).toEqual([]);
    });

    it('should return empty array for unknown component on webcomponents platform', () => {
      const result = getComponentSelector('__nonexistent_component__', 'webcomponents');
      expect(result).toEqual([]);
    });

    it('should normalize single selector to array', () => {
      // Find a component with a single selector (string, not array)
      const componentWithSingleSelector = Object.entries(COMPONENT_SELECTORS).find(
        ([, sel]) => typeof sel.angular === 'string',
      );

      if (componentWithSingleSelector) {
        const [name] = componentWithSingleSelector;
        const result = getComponentSelector(name, 'angular');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
      }
    });

    it('should preserve array selectors as-is', () => {
      // Find a component with array selectors
      const componentWithArraySelector = Object.entries(COMPONENT_SELECTORS).find(([, sel]) =>
        Array.isArray(sel.angular),
      );

      if (componentWithArraySelector) {
        const [name, sel] = componentWithArraySelector;
        const result = getComponentSelector(name, 'angular');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe((sel.angular as string[]).length);
      }
    });
  });

  describe('hasVariants()', () => {
    it('should return true for components in COMPONENT_VARIANTS', () => {
      const firstVariantComponent = Object.keys(COMPONENT_VARIANTS)[0];
      expect(hasVariants(firstVariantComponent)).toBe(true);
    });

    it('should return false for components not in COMPONENT_VARIANTS', () => {
      // Find a component that is NOT in COMPONENT_VARIANTS
      const nonVariantComponent = Object.keys(COMPONENT_SELECTORS).find((name) => !(name in COMPONENT_VARIANTS));

      if (nonVariantComponent) {
        expect(hasVariants(nonVariantComponent)).toBe(false);
      }
    });

    it('should return false for unknown components', () => {
      expect(hasVariants('__nonexistent_component__')).toBe(false);
    });
  });

  describe('getVariants()', () => {
    it('should return array for components with variants', () => {
      const firstVariantComponent = Object.keys(COMPONENT_VARIANTS)[0];
      const result = getVariants(firstVariantComponent);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for components without variants', () => {
      const nonVariantComponent = Object.keys(COMPONENT_SELECTORS).find((name) => !(name in COMPONENT_VARIANTS));

      if (nonVariantComponent) {
        expect(getVariants(nonVariantComponent)).toEqual([]);
      }
    });

    it('should return empty array for unknown components', () => {
      expect(getVariants('__nonexistent_component__')).toEqual([]);
    });
  });

  describe('isVariantTheme()', () => {
    it('should return true for variant theme names', () => {
      // Get the first variant from the first component that has variants
      const firstVariantComponent = Object.keys(COMPONENT_VARIANTS)[0];
      const firstVariant = COMPONENT_VARIANTS[firstVariantComponent][0];
      expect(isVariantTheme(firstVariant)).toBe(true);
    });

    it('should return false for base component names', () => {
      const baseComponentName = Object.keys(COMPONENT_VARIANTS)[0];
      expect(isVariantTheme(baseComponentName)).toBe(false);
    });

    it('should return false for unknown names', () => {
      expect(isVariantTheme('__nonexistent_theme__')).toBe(false);
    });
  });

  describe('getCompoundComponentInfo()', () => {
    it('should return info object for compound components', () => {
      const firstCompound = Object.keys(COMPOUND_COMPONENTS)[0];
      const result = getCompoundComponentInfo(firstCompound);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('relatedThemes');
    });

    it('should return undefined for non-compound components', () => {
      const nonCompoundComponent = Object.keys(COMPONENT_SELECTORS).find((name) => !(name in COMPOUND_COMPONENTS));

      if (nonCompoundComponent) {
        expect(getCompoundComponentInfo(nonCompoundComponent)).toBeUndefined();
      }
    });

    it('should return undefined for unknown components', () => {
      expect(getCompoundComponentInfo('__nonexistent_component__')).toBeUndefined();
    });
  });

  describe('isCompoundComponent()', () => {
    it('should return true for compound components', () => {
      const firstCompound = Object.keys(COMPOUND_COMPONENTS)[0];
      expect(isCompoundComponent(firstCompound)).toBe(true);
    });

    it('should return false for non-compound components', () => {
      const nonCompoundComponent = Object.keys(COMPONENT_SELECTORS).find((name) => !(name in COMPOUND_COMPONENTS));

      if (nonCompoundComponent) {
        expect(isCompoundComponent(nonCompoundComponent)).toBe(false);
      }
    });

    it('should return false for unknown components', () => {
      expect(isCompoundComponent('__nonexistent_component__')).toBe(false);
    });
  });

  describe('getPartSelector()', () => {
    it('should return undefined for non-compound component', () => {
      const nonCompoundComponent = Object.keys(COMPONENT_SELECTORS).find((name) => !(name in COMPOUND_COMPONENTS));

      if (nonCompoundComponent) {
        expect(getPartSelector(nonCompoundComponent, 'any-theme')).toBeUndefined();
      }
    });

    it('should return undefined for unknown compound component', () => {
      expect(getPartSelector('__nonexistent_component__', 'any-theme')).toBeUndefined();
    });

    it('should return undefined for non-existent related theme', () => {
      const firstCompound = Object.keys(COMPOUND_COMPONENTS)[0];
      expect(getPartSelector(firstCompound, '__nonexistent_theme__')).toBeUndefined();
    });

    it('should return undefined for TODO placeholders', () => {
      // Find a compound component with a TODO placeholder
      const compoundWithTodo = Object.entries(COMPOUND_COMPONENTS).find(
        ([, info]) =>
          info.innerSelectors?.webcomponents && Object.values(info.innerSelectors.webcomponents).includes('TODO'),
      );

      if (compoundWithTodo) {
        const [name, info] = compoundWithTodo;
        const todoTheme = Object.entries(info.innerSelectors!.webcomponents).find(([, value]) => value === 'TODO')?.[0];
        if (todoTheme) {
          expect(getPartSelector(name, todoTheme)).toBeUndefined();
        }
      }
    });

    it('should return actual selector when not TODO', () => {
      // Find a compound component with a non-TODO selector
      const compoundWithSelector = Object.entries(COMPOUND_COMPONENTS).find(
        ([, info]) =>
          info.innerSelectors?.webcomponents &&
          Object.values(info.innerSelectors.webcomponents).some((v) => v !== 'TODO' && v !== ''),
      );

      if (compoundWithSelector) {
        const [name, info] = compoundWithSelector;
        const definedTheme = Object.entries(info.innerSelectors!.webcomponents).find(
          ([, value]) => value !== 'TODO' && value !== '',
        )?.[0];
        if (definedTheme) {
          const result = getPartSelector(name, definedTheme);
          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
          expect(result).not.toBe('TODO');
        }
      }
    });

    it('should not throw for valid compound component and theme', () => {
      const firstCompound = Object.keys(COMPOUND_COMPONENTS)[0];
      const firstTheme = COMPOUND_COMPONENTS[firstCompound].relatedThemes[0];
      expect(() => getPartSelector(firstCompound, firstTheme)).not.toThrow();
    });
  });

  describe('hasPartSelectors()', () => {
    it('should return false for non-compound component', () => {
      const nonCompoundComponent = Object.keys(COMPONENT_SELECTORS).find((name) => !(name in COMPOUND_COMPONENTS));

      if (nonCompoundComponent) {
        expect(hasPartSelectors(nonCompoundComponent)).toBe(false);
      }
    });

    it('should return false for unknown component', () => {
      expect(hasPartSelectors('__nonexistent_component__')).toBe(false);
    });

    it('should return boolean for all compound components', () => {
      for (const name of Object.keys(COMPOUND_COMPONENTS)) {
        const result = hasPartSelectors(name);
        expect(typeof result).toBe('boolean');
      }
    });

    it('should return true when any selector is not TODO', () => {
      // Find compound with at least one non-TODO selector
      const compoundWithSelector = Object.entries(COMPOUND_COMPONENTS).find(
        ([, info]) =>
          info.innerSelectors?.webcomponents &&
          Object.values(info.innerSelectors.webcomponents).some((v) => v !== 'TODO' && v !== ''),
      );

      if (compoundWithSelector) {
        const [name] = compoundWithSelector;
        expect(hasPartSelectors(name)).toBe(true);
      }
    });

    it('should return false when all selectors are TODO', () => {
      // Find compound with all TODO selectors
      const compoundAllTodo = Object.entries(COMPOUND_COMPONENTS).find(
        ([, info]) =>
          info.innerSelectors?.webcomponents &&
          Object.values(info.innerSelectors.webcomponents).length > 0 &&
          Object.values(info.innerSelectors.webcomponents).every((v) => v === 'TODO'),
      );

      if (compoundAllTodo) {
        const [name] = compoundAllTodo;
        expect(hasPartSelectors(name)).toBe(false);
      }
    });
  });

  describe('getAllPartSelectors()', () => {
    it('should return undefined for non-compound component', () => {
      const nonCompoundComponent = Object.keys(COMPONENT_SELECTORS).find((name) => !(name in COMPOUND_COMPONENTS));

      if (nonCompoundComponent) {
        expect(getAllPartSelectors(nonCompoundComponent)).toBeUndefined();
      }
    });

    it('should return undefined for unknown component', () => {
      expect(getAllPartSelectors('__nonexistent_component__')).toBeUndefined();
    });

    it('should return object or undefined for compound components', () => {
      for (const [name, info] of Object.entries(COMPOUND_COMPONENTS)) {
        const result = getAllPartSelectors(name);
        if (info.innerSelectors?.webcomponents) {
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
        } else {
          expect(result).toBeUndefined();
        }
      }
    });

    it('should return all relatedThemes as keys when innerSelectors.webcomponents exists', () => {
      for (const [name, info] of Object.entries(COMPOUND_COMPONENTS)) {
        if (info.innerSelectors?.webcomponents) {
          const result = getAllPartSelectors(name);
          expect(result).toBeDefined();
          for (const theme of info.relatedThemes) {
            expect(result).toHaveProperty(theme);
          }
        }
      }
    });
  });
});
