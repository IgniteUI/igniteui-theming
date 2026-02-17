/**
 * Tests for component-themes.ts knowledge base
 */

import {describe, expect, it} from 'vitest';
import {
  COMPONENT_NAMES,
  COMPONENT_THEMES,
  getComponentTheme,
  getTokenNames,
  searchComponents,
  validateTokens,
} from '../../knowledge/component-themes.js';

describe('Component Themes Knowledge Base', () => {
  describe('COMPONENT_THEMES', () => {
    it('should contain expected components', () => {
      expect(COMPONENT_THEMES).toHaveProperty('avatar');
      expect(COMPONENT_THEMES).toHaveProperty('button');
      expect(COMPONENT_THEMES).toHaveProperty('flat-button');
      expect(COMPONENT_THEMES).toHaveProperty('grid');
    });

    it('should have correct structure for each component', () => {
      const avatar = COMPONENT_THEMES.avatar;
      expect(avatar).toHaveProperty('name', 'avatar');
      expect(avatar).toHaveProperty('themeFunctionName', 'avatar-theme');
      expect(avatar).toHaveProperty('tokens');
      expect(Array.isArray(avatar.tokens)).toBe(true);
    });

    it('should have tokens with correct properties', () => {
      const avatar = COMPONENT_THEMES.avatar;
      const token = avatar.tokens.find((t) => t.name === 'background');
      expect(token).toBeDefined();
      expect(token).toHaveProperty('name', 'background');
      expect(token).toHaveProperty('type');
      expect(token).toHaveProperty('description');
    });
  });

  describe('COMPONENT_NAMES', () => {
    it('should be an array of component names', () => {
      expect(Array.isArray(COMPONENT_NAMES)).toBe(true);
      expect(COMPONENT_NAMES.length).toBeGreaterThan(50);
    });

    it('should include button variants', () => {
      expect(COMPONENT_NAMES).toContain('button');
      expect(COMPONENT_NAMES).toContain('flat-button');
      expect(COMPONENT_NAMES).toContain('contained-button');
      expect(COMPONENT_NAMES).toContain('outlined-button');
      expect(COMPONENT_NAMES).toContain('fab-button');
    });
  });

  describe('getComponentTheme()', () => {
    it('should return theme for valid component', () => {
      const theme = getComponentTheme('avatar');
      expect(theme).toBeDefined();
      expect(theme?.name).toBe('avatar');
    });

    it('should return undefined for invalid component', () => {
      const theme = getComponentTheme('nonexistent');
      expect(theme).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      // Our normalized comparison should handle this in handlers
      const theme = getComponentTheme('Avatar');
      expect(theme).toBeUndefined();
    });
  });

  describe('getTokenNames()', () => {
    it('should return token names for valid component', () => {
      const tokens = getTokenNames('avatar');
      expect(tokens).toContain('background');
      expect(tokens).toContain('color');
    });

    it('should return empty array for invalid component', () => {
      const tokens = getTokenNames('nonexistent');
      expect(tokens).toEqual([]);
    });
  });

  describe('validateTokens()', () => {
    it('should validate correct tokens', () => {
      const result = validateTokens('avatar', ['background', 'color']);
      expect(result.isValid).toBe(true);
      expect(result.invalidTokens).toEqual([]);
    });

    it('should identify invalid tokens', () => {
      const result = validateTokens('avatar', ['background', 'invalid-token']);
      expect(result.isValid).toBe(false);
      expect(result.invalidTokens).toContain('invalid-token');
    });

    it('should return valid tokens list', () => {
      const result = validateTokens('avatar', ['background']);
      expect(result.validTokens).toContain('background');
      expect(result.validTokens).toContain('color');
    });
  });

  describe('searchComponents()', () => {
    it('should find components by partial name', () => {
      const results = searchComponents('button');
      expect(results).toContain('button');
      expect(results).toContain('flat-button');
      expect(results).toContain('button-group');
    });

    it('should return empty array for no matches', () => {
      const results = searchComponents('xyz123nonexistent');
      expect(results).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const results = searchComponents('AVATAR');
      expect(results).toContain('avatar');
    });
  });
});
