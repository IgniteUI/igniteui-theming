import {describe, expect, it} from 'vitest';
import {RESOURCE_DEFINITIONS, RESOURCE_URIS} from '../../../resources/index.js';
import {handleReadResource} from '../../../tools/handlers/resource.js';

describe('handleReadResource', () => {
  describe('valid URIs', () => {
    it('returns JSON content for palette presets', async () => {
      const result = await handleReadResource({uri: RESOURCE_URIS.PALETTES});

      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();

      const payload = JSON.parse(result.content[0].text);
      expect(Object.keys(payload).length).toBeGreaterThan(0);
    });

    it('returns JSON content for light palette presets', async () => {
      const result = await handleReadResource({
        uri: RESOURCE_URIS.PALETTES_LIGHT,
      });

      expect(result.isError).toBeUndefined();

      const payload = JSON.parse(result.content[0].text);
      const keys = Object.keys(payload);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys.every((k) => k.includes('light'))).toBe(true);
    });

    it('returns JSON content for platform listing', async () => {
      const result = await handleReadResource({uri: RESOURCE_URIS.PLATFORMS});

      expect(result.isError).toBeUndefined();

      const payload = JSON.parse(result.content[0].text);
      expect(payload.platforms).toContain('angular');
      expect(payload.platforms).toContain('webcomponents');
    });

    it('returns JSON content for a specific platform', async () => {
      const result = await handleReadResource({
        uri: RESOURCE_URIS.PLATFORM_ANGULAR,
      });

      expect(result.isError).toBeUndefined();

      const payload = JSON.parse(result.content[0].text);
      expect(payload).toHaveProperty('schemas');
      expect(payload).toHaveProperty('palettes');
    });

    it('returns markdown content for color rules', async () => {
      const result = await handleReadResource({
        uri: RESOURCE_URIS.GUIDANCE_COLORS_RULES,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text.length).toBeGreaterThan(0);
      // Markdown resources should not parse as JSON
      expect(() => JSON.parse(result.content[0].text)).toThrow();
    });

    it('returns markdown content for layout docs', async () => {
      const result = await handleReadResource({
        uri: RESOURCE_URIS.DOCS_LAYOUT_OVERVIEW,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text.length).toBeGreaterThan(0);
    });

    it('returns content for every defined resource', async () => {
      for (const resource of RESOURCE_DEFINITIONS) {
        const result = await handleReadResource({uri: resource.uri});

        expect(result.isError).toBeUndefined();
        expect(result.content[0].text.length).toBeGreaterThan(0);
      }
    });
  });

  describe('invalid URIs', () => {
    it('returns an error for an unknown URI', async () => {
      const result = await handleReadResource({uri: 'theming://nonexistent'});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Resource not found');
      expect(result.content[0].text).toContain('theming://nonexistent');
    });

    it('includes available resource URIs in the error', async () => {
      const result = await handleReadResource({uri: 'theming://bad'});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Available resources:');
      expect(result.content[0].text).toContain(RESOURCE_URIS.PLATFORMS);
      expect(result.content[0].text).toContain(RESOURCE_URIS.PALETTES);
    });

    it('returns an error for an empty URI', async () => {
      const result = await handleReadResource({uri: ''});

      expect(result.isError).toBe(true);
    });

    it('returns an error for a non-theming URI scheme', async () => {
      const result = await handleReadResource({uri: 'https://example.com'});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Resource not found');
    });
  });
});
