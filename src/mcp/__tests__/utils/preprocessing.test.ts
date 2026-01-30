import {describe, it, expect} from 'vitest';
import {z} from 'zod';
import {deepParseJsonStrings, withPreprocessing} from '../../utils/preprocessing.js';

describe('deepParseJsonStrings', () => {
  describe('string handling', () => {
    it('parses JSON object strings', () => {
      const result = deepParseJsonStrings('{"mode": "shades", "baseColor": "#1976D2"}');

      expect(result).toEqual({mode: 'shades', baseColor: '#1976D2'});
    });

    it('parses JSON array strings', () => {
      const result = deepParseJsonStrings('[1, 2, 3]');

      expect(result).toEqual([1, 2, 3]);
    });

    it('leaves regular strings unchanged', () => {
      expect(deepParseJsonStrings('hello')).toBe('hello');
      expect(deepParseJsonStrings('#FF0000')).toBe('#FF0000');
      expect(deepParseJsonStrings('red')).toBe('red');
    });

    it('leaves invalid JSON strings unchanged', () => {
      expect(deepParseJsonStrings('{invalid json}')).toBe('{invalid json}');
      expect(deepParseJsonStrings('[not valid')).toBe('[not valid');
    });

    it('handles whitespace around JSON strings', () => {
      const result = deepParseJsonStrings('  {"key": "value"}  ');

      expect(result).toEqual({key: 'value'});
    });
  });

  describe('object handling', () => {
    it('recursively parses JSON strings in object properties', () => {
      const input = {
        primary: '{"mode": "shades", "baseColor": "red"}',
        secondary: '{"mode": "shades", "baseColor": "blue"}',
        name: 'my-palette',
      };

      const result = deepParseJsonStrings(input);

      expect(result).toEqual({
        primary: {mode: 'shades', baseColor: 'red'},
        secondary: {mode: 'shades', baseColor: 'blue'},
        name: 'my-palette',
      });
    });

    it('handles mixed object and string values', () => {
      const input = {
        primary: {mode: 'shades', baseColor: 'red'},
        secondary: '{"mode": "shades", "baseColor": "blue"}',
      };

      const result = deepParseJsonStrings(input);

      expect(result).toEqual({
        primary: {mode: 'shades', baseColor: 'red'},
        secondary: {mode: 'shades', baseColor: 'blue'},
      });
    });

    it('handles deeply nested JSON strings', () => {
      const input = {
        level1: '{"level2": "{\\"level3\\": \\"value\\"}"}',
      };

      const result = deepParseJsonStrings(input);

      expect(result).toEqual({
        level1: {level2: {level3: 'value'}},
      });
    });

    it('preserves non-JSON properties', () => {
      const input = {
        name: 'test',
        count: 42,
        active: true,
        data: null,
      };

      const result = deepParseJsonStrings(input);

      expect(result).toEqual(input);
    });
  });

  describe('array handling', () => {
    it('recursively parses JSON strings in arrays', () => {
      const input = ['{"key": "value"}', 'regular string', 42];

      const result = deepParseJsonStrings(input);

      expect(result).toEqual([{key: 'value'}, 'regular string', 42]);
    });

    it('handles arrays inside objects', () => {
      const input = {
        items: ['{"id": 1}', '{"id": 2}'],
      };

      const result = deepParseJsonStrings(input);

      expect(result).toEqual({
        items: [{id: 1}, {id: 2}],
      });
    });
  });

  describe('primitive handling', () => {
    it('returns numbers unchanged', () => {
      expect(deepParseJsonStrings(42)).toBe(42);
      expect(deepParseJsonStrings(3.14)).toBe(3.14);
    });

    it('returns booleans unchanged', () => {
      expect(deepParseJsonStrings(true)).toBe(true);
      expect(deepParseJsonStrings(false)).toBe(false);
    });

    it('returns null unchanged', () => {
      expect(deepParseJsonStrings(null)).toBe(null);
    });

    it('returns undefined unchanged', () => {
      expect(deepParseJsonStrings(undefined)).toBe(undefined);
    });
  });

  describe('real-world scenarios', () => {
    it('handles create_custom_palette input with JSON string colors', () => {
      const input = {
        primary: '{"mode": "shades", "baseColor": "red"}',
        secondary: '{"mode": "shades", "baseColor": "blue"}',
        surface: '{"mode": "shades", "baseColor": "white"}',
        variant: 'light',
        output: 'css',
      };

      const result = deepParseJsonStrings(input);

      expect(result).toEqual({
        primary: {mode: 'shades', baseColor: 'red'},
        secondary: {mode: 'shades', baseColor: 'blue'},
        surface: {mode: 'shades', baseColor: 'white'},
        variant: 'light',
        output: 'css',
      });
    });

    it('handles create_component_theme input with JSON string tokens', () => {
      const input = {
        component: 'button',
        tokens: '{"background": "#1976D2", "border-radius": "4px"}',
      };

      const result = deepParseJsonStrings(input);

      expect(result).toEqual({
        component: 'button',
        tokens: {background: '#1976D2', 'border-radius': '4px'},
      });
    });

    it('handles create_typography input with JSON string customScale', () => {
      const input = {
        fontFamily: 'Roboto',
        customScale: '{"h1": {"fontSize": "2rem"}, "body1": {"fontSize": "1rem"}}',
      };

      const result = deepParseJsonStrings(input);

      expect(result).toEqual({
        fontFamily: 'Roboto',
        customScale: {
          h1: {fontSize: '2rem'},
          body1: {fontSize: '1rem'},
        },
      });
    });

    it('handles explicit shades with all 14 values', () => {
      const explicitShades = {
        '50': '#E3F2FD',
        '100': '#BBDEFB',
        '200': '#90CAF9',
        '300': '#64B5F6',
        '400': '#42A5F5',
        '500': '#2196F3',
        '600': '#1E88E5',
        '700': '#1976D2',
        '800': '#1565C0',
        '900': '#0D47A1',
        A100: '#82B1FF',
        A200: '#448AFF',
        A400: '#2979FF',
        A700: '#2962FF',
      };

      const input = {
        primary: JSON.stringify({mode: 'explicit', shades: explicitShades}),
        secondary: '{"mode": "shades", "baseColor": "blue"}',
        surface: '{"mode": "shades", "baseColor": "white"}',
      };

      const result = deepParseJsonStrings(input);

      expect(result).toEqual({
        primary: {mode: 'explicit', shades: explicitShades},
        secondary: {mode: 'shades', baseColor: 'blue'},
        surface: {mode: 'shades', baseColor: 'white'},
      });
    });
  });
});

describe('withPreprocessing', () => {
  it('preprocesses params and validates with schema', async () => {
    const schema = z.object({
      data: z.object({
        value: z.string(),
      }),
    });

    const handler = async (params: {data: {value: string}}) => ({
      content: [{type: 'text' as const, text: params.data.value}],
    });

    const wrapped = withPreprocessing(schema, handler);

    const result = await wrapped({
      data: '{"value": "hello"}',
    });

    expect(result).toEqual({
      content: [{type: 'text', text: 'hello'}],
    });
  });

  it('throws on schema validation failure', async () => {
    const schema = z.object({
      required: z.string(),
    });

    const handler = async (params: {required: string}) => ({
      content: [{type: 'text' as const, text: params.required}],
    });

    const wrapped = withPreprocessing(schema, handler);

    await expect(wrapped({})).rejects.toThrow();
  });

  it('works with synchronous handlers', async () => {
    const schema = z.object({
      name: z.string(),
    });

    const handler = (params: {name: string}) => ({
      content: [{type: 'text' as const, text: `Hello, ${params.name}`}],
    });

    const wrapped = withPreprocessing(schema, handler);

    const result = await wrapped({name: 'World'});

    expect(result).toEqual({
      content: [{type: 'text', text: 'Hello, World'}],
    });
  });

  it('handles already-parsed objects without modification', async () => {
    const schema = z.object({
      nested: z.object({
        key: z.string(),
      }),
    });

    const handler = async (params: {nested: {key: string}}) => ({
      content: [{type: 'text' as const, text: params.nested.key}],
    });

    const wrapped = withPreprocessing(schema, handler);

    // Pass object directly (not as JSON string)
    const result = await wrapped({
      nested: {key: 'value'},
    });

    expect(result).toEqual({
      content: [{type: 'text', text: 'value'}],
    });
  });
});
