import {describe, expect, it} from 'vitest';
import {handleGetColor} from '../../../tools/handlers/color.js';

describe('handleGetColor', () => {
  it('returns a CSS variable reference by default', async () => {
    const result = await handleGetColor({color: 'primary'});
    const text = result.content[0].text;

    expect(text).toContain('```css');
    expect(text).toContain('var(--ig-primary-500)');
    expect(text).toContain('Primary color, shade 500');
  });

  it('returns contrast color when requested', async () => {
    const result = await handleGetColor({color: 'primary', contrast: true});
    const text = result.content[0].text;

    expect(text).toContain('Contrast color for primary 500');
    expect(text).toContain('var(--ig-primary-500-contrast)');
  });

  it('applies opacity using relative color syntax', async () => {
    const result = await handleGetColor({color: 'primary', opacity: 0.5});
    const text = result.content[0].text;

    expect(text).toContain('50% opacity');
    expect(text).toContain('hsl(from var(--ig-primary-500) h s l / 0.5)');
  });
});
