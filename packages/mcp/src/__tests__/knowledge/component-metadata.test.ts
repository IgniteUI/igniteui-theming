/**
 * Tests for component-metadata.ts knowledge base
 *
 * These tests verify:
 * 1. COMPONENT_METADATA unified data structure (selectors, variants, compound info)
 * 2. Accessor function behavior
 * 3. Structural invariants (compound field validation, etc.)
 * 4. TokenDerivation format validation
 */

import { describe, expect, it } from "vitest";
import {
  COMPONENT_METADATA,
  getComponentPlatformAvailability,
  getComponentSelector,
  getComponentsForPlatform,
  getCompoundComponentInfo,
  getThemingSelector,
  getTokenDerivationsForChild,
  getVariants,
  hasVariants,
  isComponentAvailable,
  isCompoundComponent,
  isVariantTheme,
  VARIANT_THEME_NAMES,
} from "../../knowledge/component-metadata.js";

const VALID_TRANSFORMS = ["identity", "adaptive-contrast", "dynamic-shade"];

describe("Component Metadata Knowledge Base", () => {
  // ===== Data Structure Sanity Checks =====

  describe("COMPONENT_METADATA data structure", () => {
    it("should be a non-empty object", () => {
      expect(COMPONENT_METADATA).toBeDefined();
      expect(typeof COMPONENT_METADATA).toBe("object");
      expect(Object.keys(COMPONENT_METADATA).length).toBeGreaterThan(0);
    });

    it("non-childOf entries should have a selectors object with angular and webcomponents properties", () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (metadata.childOf) continue; // childOf entries don't need selectors
        expect(metadata, `${name} should have selectors`).toHaveProperty(
          "selectors",
        );
        expect(
          metadata.selectors,
          `${name}.selectors should have angular property`,
        ).toHaveProperty("angular");
        expect(
          metadata.selectors,
          `${name}.selectors should have webcomponents property`,
        ).toHaveProperty("webcomponents");
      }
    });

    it("childOf entries should not have selectors", () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.childOf) continue;
        expect(
          metadata.selectors,
          `${name} has childOf and should not have selectors`,
        ).toBeUndefined();
      }
    });

    it("selectors should be strings, arrays of strings, or null", () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.selectors) continue; // childOf entries have no selectors
        const { angular, webcomponents } = metadata.selectors;
        const angularIsValid =
          angular === null ||
          typeof angular === "string" ||
          (Array.isArray(angular) &&
            angular.every((s) => typeof s === "string"));
        const webcomponentsIsValid =
          webcomponents === null ||
          typeof webcomponents === "string" ||
          (Array.isArray(webcomponents) &&
            webcomponents.every((s) => typeof s === "string"));

        expect(
          angularIsValid,
          `${name}.selectors.angular should be string, string[], or null`,
        ).toBe(true);
        expect(
          webcomponentsIsValid,
          `${name}.selectors.webcomponents should be string, string[], or null`,
        ).toBe(true);
      }
    });
  });

  // ===== Variant Structure Tests =====

  describe("theme alias structure", () => {
    it("theme aliases should reference existing component metadata entries", () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.theme) continue;
        expect(
          COMPONENT_METADATA,
          `${name}.theme alias '${metadata.theme}' should exist in COMPONENT_METADATA`,
        ).toHaveProperty(metadata.theme);
      }
    });

    it("theme aliases should not be self-referential", () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.theme) continue;
        expect(
          metadata.theme,
          `${name}.theme alias should not reference itself`,
        ).not.toBe(name);
      }
    });

    it("theme alias chains should not contain cycles", () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (!metadata.theme) continue;

        const visited = new Set<string>([name]);
        let current: string | undefined = metadata.theme;

        while (current) {
          expect(
            visited.has(current),
            `theme alias cycle detected starting at '${name}'`,
          ).toBe(false);
          visited.add(current);
          current = COMPONENT_METADATA[current]?.theme;
        }
      }
    });
  });

  describe("variants structure", () => {
    it("components with variants should have non-empty string arrays", () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (metadata.variants) {
          expect(
            Array.isArray(metadata.variants),
            `${name}.variants should be an array`,
          ).toBe(true);
          expect(
            metadata.variants.length,
            `${name}.variants should be non-empty`,
          ).toBeGreaterThan(0);
          for (const variant of metadata.variants) {
            expect(typeof variant, `${name} variant should be a string`).toBe(
              "string",
            );
          }
        }
      }
    });

    it("each variant name should also exist as a component in COMPONENT_METADATA", () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (metadata.variants) {
          for (const variant of metadata.variants) {
            expect(
              COMPONENT_METADATA,
              `variant '${variant}' of '${name}' should exist in COMPONENT_METADATA`,
            ).toHaveProperty(variant);
          }
        }
      }
    });
  });

  // ===== Compound Structure Tests =====

  describe("compound components structure", () => {
    it("compound entries should have required fields", () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (metadata.compound) {
          expect(
            metadata.compound,
            `${name}.compound should have description`,
          ).toHaveProperty("description");
          expect(
            typeof metadata.compound.description,
            `${name}.compound.description should be a string`,
          ).toBe("string");
          expect(
            metadata.compound,
            `${name}.compound should have relatedThemes`,
          ).toHaveProperty("relatedThemes");
          expect(
            Array.isArray(metadata.compound.relatedThemes),
            `${name}.compound.relatedThemes should be an array`,
          ).toBe(true);
        }
      }
    });
  });

  // ===== Token Derivation Validation =====

  describe("TokenDerivation format validation", () => {
    it('keys should match "childTheme.childToken" pattern', () => {
      for (const [compoundName, metadata] of Object.entries(
        COMPONENT_METADATA,
      )) {
        if (!metadata.compound?.tokenDerivations) continue;

        for (const key of Object.keys(metadata.compound.tokenDerivations)) {
          expect(
            key,
            `${compoundName} derivation key '${key}' should match 'child.token' pattern`,
          ).toMatch(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/);
        }
      }
    });

    it('"from" field should match "componentName.tokenName" pattern', () => {
      for (const [compoundName, metadata] of Object.entries(
        COMPONENT_METADATA,
      )) {
        if (!metadata.compound?.tokenDerivations) continue;

        for (const [key, derivation] of Object.entries(
          metadata.compound.tokenDerivations,
        )) {
          expect(
            derivation.from,
            `${compoundName} derivation '${key}' from field '${derivation.from}' should match 'component.token' pattern`,
          ).toMatch(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/);
        }
      }
    });

    it('"transform" should be one of the valid values', () => {
      for (const [compoundName, metadata] of Object.entries(
        COMPONENT_METADATA,
      )) {
        if (!metadata.compound?.tokenDerivations) continue;

        for (const [key, derivation] of Object.entries(
          metadata.compound.tokenDerivations,
        )) {
          expect(
            VALID_TRANSFORMS,
            `${compoundName} derivation '${key}' transform '${derivation.transform}' should be valid`,
          ).toContain(derivation.transform);
        }
      }
    });

    it('"args" should be an object when present', () => {
      for (const [compoundName, metadata] of Object.entries(
        COMPONENT_METADATA,
      )) {
        if (!metadata.compound?.tokenDerivations) continue;

        for (const [key, derivation] of Object.entries(
          metadata.compound.tokenDerivations,
        )) {
          if (derivation.args !== undefined) {
            expect(
              typeof derivation.args,
              `${compoundName} derivation '${key}' args should be an object`,
            ).toBe("object");
          }
        }
      }
    });
  });

  // ===== VARIANT_THEME_NAMES Derivation =====

  describe("VARIANT_THEME_NAMES", () => {
    it("should be a non-empty Set", () => {
      expect(VARIANT_THEME_NAMES).toBeDefined();
      expect(VARIANT_THEME_NAMES).toBeInstanceOf(Set);
      expect(VARIANT_THEME_NAMES.size).toBeGreaterThan(0);
    });

    it("should contain exactly the variants from COMPONENT_METADATA", () => {
      const expected = new Set(
        Object.values(COMPONENT_METADATA)
          .filter((m) => m.variants)
          .flatMap((m) => m.variants!),
      );

      expect(VARIANT_THEME_NAMES).toEqual(expected);
    });

    it("should not contain base component names", () => {
      for (const [name, metadata] of Object.entries(COMPONENT_METADATA)) {
        if (metadata.variants) {
          expect(
            VARIANT_THEME_NAMES.has(name),
            `base component '${name}' should not be in VARIANT_THEME_NAMES`,
          ).toBe(false);
        }
      }
    });
  });

  // ===== Accessor Function Tests =====

  describe("getComponentSelector()", () => {
    it("should always return an array", () => {
      const firstComponent = Object.keys(COMPONENT_METADATA)[0];
      const angularResult = getComponentSelector(firstComponent, "angular");
      const webcomponentsResult = getComponentSelector(
        firstComponent,
        "webcomponents",
      );

      expect(Array.isArray(angularResult)).toBe(true);
      expect(Array.isArray(webcomponentsResult)).toBe(true);
    });

    it("should return non-empty array for existing components", () => {
      const firstComponent = Object.keys(COMPONENT_METADATA)[0];
      const result = getComponentSelector(firstComponent, "angular");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return empty array for unknown component", () => {
      expect(
        getComponentSelector("__nonexistent_component__", "angular"),
      ).toEqual([]);
    });

    it("should return empty array for unknown component on webcomponents platform", () => {
      expect(
        getComponentSelector("__nonexistent_component__", "webcomponents"),
      ).toEqual([]);
    });

    it("should normalize single selector to array", () => {
      const componentWithSingleSelector = Object.entries(
        COMPONENT_METADATA,
      ).find(([, m]) => m.selectors && typeof m.selectors.angular === "string");

      if (componentWithSingleSelector) {
        const [name] = componentWithSingleSelector;
        const result = getComponentSelector(name, "angular");
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
      }
    });

    it("should preserve array selectors as-is", () => {
      const componentWithArraySelector = Object.entries(
        COMPONENT_METADATA,
      ).find(([, m]) => m.selectors && Array.isArray(m.selectors.angular));

      if (componentWithArraySelector) {
        const [name, m] = componentWithArraySelector;
        const result = getComponentSelector(name, "angular");
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe((m.selectors!.angular as string[]).length);
      }
    });
  });

  describe("isComponentAvailable()", () => {
    it("should return true for components available on platform", () => {
      const component = Object.entries(COMPONENT_METADATA).find(
        ([, m]) =>
          m.selectors?.angular !== null && m.selectors?.angular !== undefined,
      );
      if (component) {
        expect(isComponentAvailable(component[0], "angular")).toBe(true);
      }
    });

    it("should return false for components not available on platform", () => {
      const component = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.selectors && m.selectors.angular === null,
      );
      if (component) {
        expect(isComponentAvailable(component[0], "angular")).toBe(false);
      }
    });

    it("should return false for unknown components", () => {
      expect(isComponentAvailable("__nonexistent__", "angular")).toBe(false);
    });

    it("should return false for childOf entries (no selectors)", () => {
      expect(isComponentAvailable("list-item", "angular")).toBe(false);
    });
  });

  describe("getComponentsForPlatform()", () => {
    it("should return non-empty array for angular", () => {
      const result = getComponentsForPlatform("angular");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return non-empty array for webcomponents", () => {
      const result = getComponentsForPlatform("webcomponents");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should only include components available on that platform", () => {
      const angularComponents = getComponentsForPlatform("angular");
      for (const name of angularComponents) {
        expect(COMPONENT_METADATA[name].selectors!.angular).not.toBeNull();
      }
    });

    it("should not include childOf entries", () => {
      const angularComponents = getComponentsForPlatform("angular");
      expect(angularComponents).not.toContain("list-item");
      expect(angularComponents).not.toContain("card-header");
    });
  });

  describe("getComponentPlatformAvailability()", () => {
    it("should return availability object for known components", () => {
      const firstComponent = Object.keys(COMPONENT_METADATA)[0];
      const result = getComponentPlatformAvailability(firstComponent);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("angular");
      expect(result).toHaveProperty("webcomponents");
    });

    it("should return undefined for unknown components", () => {
      expect(
        getComponentPlatformAvailability("__nonexistent__"),
      ).toBeUndefined();
    });
  });

  describe("hasVariants()", () => {
    it("should return true for components with variants", () => {
      const variantComponent = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.variants,
      );
      if (variantComponent) {
        expect(hasVariants(variantComponent[0])).toBe(true);
      }
    });

    it("should return false for components without variants", () => {
      const nonVariantComponent = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => !m.variants,
      );
      if (nonVariantComponent) {
        expect(hasVariants(nonVariantComponent[0])).toBe(false);
      }
    });

    it("should return false for unknown components", () => {
      expect(hasVariants("__nonexistent_component__")).toBe(false);
    });
  });

  describe("getVariants()", () => {
    it("should return array for components with variants", () => {
      const variantComponent = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.variants,
      );
      if (variantComponent) {
        const result = getVariants(variantComponent[0]);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it("should return empty array for components without variants", () => {
      const nonVariantComponent = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => !m.variants,
      );
      if (nonVariantComponent) {
        expect(getVariants(nonVariantComponent[0])).toEqual([]);
      }
    });

    it("should return empty array for unknown components", () => {
      expect(getVariants("__nonexistent_component__")).toEqual([]);
    });
  });

  describe("isVariantTheme()", () => {
    it("should return true for variant theme names", () => {
      const variantComponent = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.variants,
      );
      if (variantComponent) {
        const firstVariant = variantComponent[1].variants![0];
        expect(isVariantTheme(firstVariant)).toBe(true);
      }
    });

    it("should return false for base component names", () => {
      const baseComponent = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.variants,
      );
      if (baseComponent) {
        expect(isVariantTheme(baseComponent[0])).toBe(false);
      }
    });

    it("should return false for unknown names", () => {
      expect(isVariantTheme("__nonexistent_theme__")).toBe(false);
    });
  });

  describe("getCompoundComponentInfo()", () => {
    it("should return info object for compound components", () => {
      const compoundComponent = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.compound,
      );
      if (compoundComponent) {
        const result = getCompoundComponentInfo(compoundComponent[0]);
        expect(result).toBeDefined();
        expect(result).toHaveProperty("description");
        expect(result).toHaveProperty("relatedThemes");
      }
    });

    it("should return undefined for non-compound components", () => {
      const simpleComponent = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => !m.compound,
      );
      if (simpleComponent) {
        expect(getCompoundComponentInfo(simpleComponent[0])).toBeUndefined();
      }
    });

    it("should return undefined for unknown components", () => {
      expect(
        getCompoundComponentInfo("__nonexistent_component__"),
      ).toBeUndefined();
    });
  });

  describe("isCompoundComponent()", () => {
    it("should return true for compound components", () => {
      const compoundComponent = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.compound,
      );
      if (compoundComponent) {
        expect(isCompoundComponent(compoundComponent[0])).toBe(true);
      }
    });

    it("should return false for non-compound components", () => {
      const simpleComponent = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => !m.compound,
      );
      if (simpleComponent) {
        expect(isCompoundComponent(simpleComponent[0])).toBe(false);
      }
    });

    it("should return false for unknown components", () => {
      expect(isCompoundComponent("__nonexistent_component__")).toBe(false);
    });
  });

  describe("getTokenDerivationsForChild()", () => {
    it("should return derivations for a known child theme", () => {
      const withDerivations = Object.entries(COMPONENT_METADATA).find(
        ([, m]) =>
          m.compound?.tokenDerivations &&
          Object.keys(m.compound.tokenDerivations).length > 0,
      );

      if (withDerivations) {
        const [compoundName, metadata] = withDerivations;
        const firstKey = Object.keys(metadata.compound!.tokenDerivations!)[0];
        const childTheme = firstKey.split(".")[0];

        const result = getTokenDerivationsForChild(compoundName, childTheme);
        expect(Object.keys(result).length).toBeGreaterThan(0);

        for (const key of Object.keys(result)) {
          expect(key).not.toContain(".");
        }

        for (const derivation of Object.values(result)) {
          expect(derivation).toHaveProperty("from");
          expect(derivation).toHaveProperty("transform");
          expect(VALID_TRANSFORMS).toContain(derivation.transform);
        }
      }
    });

    it("should return empty object for unknown child theme", () => {
      const firstCompound = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.compound,
      );
      if (firstCompound) {
        const result = getTokenDerivationsForChild(
          firstCompound[0],
          "__nonexistent_child__",
        );
        expect(result).toEqual({});
      }
    });

    it("should return empty object for unknown compound component", () => {
      expect(
        getTokenDerivationsForChild("__nonexistent_component__", "any-child"),
      ).toEqual({});
    });

    it("should return empty object for compound without derivations", () => {
      const withoutDerivations = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => m.compound && !m.compound.tokenDerivations,
      );

      if (withoutDerivations) {
        const result = getTokenDerivationsForChild(
          withoutDerivations[0],
          "any-child",
        );
        expect(result).toEqual({});
      }
    });

    it("should only return derivations for the requested child", () => {
      const withMultipleChildren = Object.entries(COMPONENT_METADATA).find(
        ([, m]) => {
          if (!m.compound?.tokenDerivations) return false;
          const prefixes = new Set(
            Object.keys(m.compound.tokenDerivations).map(
              (k) => k.split(".")[0],
            ),
          );
          return prefixes.size > 1;
        },
      );

      if (withMultipleChildren) {
        const [compoundName, metadata] = withMultipleChildren;
        const allKeys = Object.keys(metadata.compound!.tokenDerivations!);
        const firstChild = allKeys[0].split(".")[0];

        const result = getTokenDerivationsForChild(compoundName, firstChild);

        for (const key of Object.keys(result)) {
          expect(metadata.compound!.tokenDerivations).toHaveProperty(
            `${firstChild}.${key}`,
          );
        }
      }
    });
  });

  // ===== Child Component (childOf) Tests =====

  describe("childOf structure", () => {
    const CHILD_ENTRIES = Object.entries(COMPONENT_METADATA).filter(
      ([_, m]) => m.childOf,
    );

    it("should have child component entries", () => {
      expect(CHILD_ENTRIES.length).toBeGreaterThan(0);
    });

    it("childOf entries should not have theme (resolved via parent)", () => {
      for (const [name, metadata] of CHILD_ENTRIES) {
        expect(
          metadata.theme,
          `${name} has childOf and should not have theme (theme is resolved via childOf)`,
        ).toBeUndefined();
      }
    });

    it("childOf should reference an existing component in COMPONENT_METADATA", () => {
      for (const [name, metadata] of CHILD_ENTRIES) {
        expect(
          COMPONENT_METADATA,
          `${name}.childOf '${metadata.childOf}' should exist in COMPONENT_METADATA`,
        ).toHaveProperty(metadata.childOf!);
      }
    });

    it("childOf parent should have at least one non-null selector", () => {
      for (const [name, metadata] of CHILD_ENTRIES) {
        const parent = COMPONENT_METADATA[metadata.childOf!];
        const hasSelector =
          parent.selectors?.angular !== null ||
          parent.selectors?.webcomponents !== null;

        expect(
          hasSelector,
          `${name}.childOf parent '${metadata.childOf}' should have at least one non-null selector`,
        ).toBe(true);
      }
    });

    it("childOf and compound should be mutually exclusive", () => {
      for (const [name, metadata] of CHILD_ENTRIES) {
        expect(
          metadata.compound,
          `${name} has childOf and should not have compound`,
        ).toBeUndefined();
      }
    });

    it("child entries should not have variants", () => {
      for (const [name, metadata] of CHILD_ENTRIES) {
        expect(
          metadata.variants,
          `${name} has childOf and should not have variants`,
        ).toBeUndefined();
      }
    });

    it("child entries should not appear in VARIANT_THEME_NAMES", () => {
      for (const [name] of CHILD_ENTRIES) {
        expect(
          VARIANT_THEME_NAMES.has(name),
          `child component '${name}' should not be in VARIANT_THEME_NAMES`,
        ).toBe(false);
      }
    });
  });

  describe("specific child component entries", () => {
    it("accordion-header should be a child of accordion", () => {
      const entry = COMPONENT_METADATA["accordion-header"];
      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("accordion");
    });

    it("accordion-body should be a child of accordion", () => {
      const entry = COMPONENT_METADATA["accordion-body"];
      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("accordion");
    });

    it("list-item should be a child of list", () => {
      const entry = COMPONENT_METADATA["list-item"];

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("list");
      expect(entry.selectors).toBeUndefined();
      expect(entry.theme).toBeUndefined();
    });

    it("list-header should be a child of list", () => {
      const entry = COMPONENT_METADATA["list-header"];

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("list");
    });

    it("drop-down-item should be a child of drop-down", () => {
      const entry = COMPONENT_METADATA["drop-down-item"];

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("drop-down");
    });

    it("nav-drawer-item should be a child of navdrawer", () => {
      const entry = COMPONENT_METADATA["nav-drawer-item"];

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("navdrawer");
    });

    it("tab-item should be a child of tabs", () => {
      const entry = COMPONENT_METADATA["tab-item"];

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("tabs");
    });

    it("step should be a child of stepper", () => {
      const entry = COMPONENT_METADATA.step;

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("stepper");
    });

    it("card-header should be a child of card", () => {
      const entry = COMPONENT_METADATA["card-header"];

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("card");
    });

    it("card-content should be a child of card", () => {
      const entry = COMPONENT_METADATA["card-content"];

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("card");
    });

    it("card-actions should be a child of card", () => {
      const entry = COMPONENT_METADATA["card-actions"];

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("card");
    });

    it("expansion-panel-header should be a child of expansion-panel", () => {
      const entry = COMPONENT_METADATA["expansion-panel-header"];

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("expansion-panel");
    });

    it("expansion-panel-body should be a child of expansion-panel", () => {
      const entry = COMPONENT_METADATA["expansion-panel-body"];

      expect(entry).toBeDefined();
      expect(entry.childOf).toBe("expansion-panel");
    });
  });

  // ===== getThemingSelector Tests =====

  describe("getThemingSelector()", () => {
    it("should return parent selector for child component", () => {
      const result = getThemingSelector("list-item", "angular");

      expect(result).toEqual(["igx-list"]);
    });

    it("should return parent WC selector for child component", () => {
      const result = getThemingSelector("nav-drawer-item", "webcomponents");

      expect(result).toEqual(["igc-nav-drawer"]);
    });

    it("should return own selector for non-child component", () => {
      const result = getThemingSelector("avatar", "angular");

      expect(result).toEqual(["igx-avatar"]);
    });

    it("should return own selector for same-element alias (textarea)", () => {
      const result = getThemingSelector("textarea", "angular");

      expect(result).toEqual([".igx-input-group--textarea-group"]);
    });

    it("should return empty array for unknown component", () => {
      const result = getThemingSelector("nonexistent", "angular");

      expect(result).toEqual([]);
    });
  });
});
