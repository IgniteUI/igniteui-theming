/**
 * Tests for get_component_design_tokens handler.
 */

import {describe, it, expect} from 'vitest';
import {handleGetComponentDesignTokens} from '../../../tools/handlers/component-tokens.js';

describe('handleGetComponentDesignTokens', () => {
  it('uses instruction-oriented opening format', async () => {
    const result = await handleGetComponentDesignTokens({component: 'date-picker'});
    const text = result.content[0].text;

    expect(text).toContain('Implement a theme for the `date-picker` component using the following guidance.');
  });

  it('shows two platform sections: Angular and WC/React/Blazor', async () => {
    const result = await handleGetComponentDesignTokens({component: 'date-picker'});
    const text = result.content[0].text;

    expect(text).toContain('**Angular:**');
    expect(text).toContain('**Web Components:**');
    // Old format should NOT be present
    expect(text).not.toContain('**Scopes by Platform:**');
  });

  it('shows overlay scope for Angular but omits it for WC group (date-picker)', async () => {
    const result = await handleGetComponentDesignTokens({component: 'date-picker'});
    const text = result.content[0].text;

    // Angular section has both inline and overlay scopes
    expect(text).toContain('| inline | `igx-date-picker` |');
    expect(text).toContain('| overlay | `.igx-date-picker` |');

    // WC section has inline only - overlay row should NOT appear
    expect(text).toContain('| inline | `igc-date-picker` |');
    // Overlay N/A row should be gone
    expect(text).not.toContain('| overlay | N/A |');
  });

  it('shows per-platform related themes for compound components', async () => {
    const result = await handleGetComponentDesignTokens({component: 'date-picker'});
    const text = result.content[0].text;

    // Angular: calendar in overlay scope
    expect(text).toContain('| `calendar` | overlay | `.igx-date-picker` |');
    // WC: calendar in inline scope
    expect(text).toContain('| `calendar` | inline | `igc-date-picker` |');
  });

  it('joins array scope values with | for grid', async () => {
    const result = await handleGetComponentDesignTokens({component: 'grid'});
    const text = result.content[0].text;

    expect(text).toContain(
      '| inline | `igx-grid | igx-tree-grid | igx-hierarchical-grid | igx-pivot-grid | igx-grid-excel-style-filtering` |',
    );
    expect(text).toContain(
      '| inline | `igc-grid | igc-tree-grid | igc-hierarchical-grid | igc-pivot-grid | igc-grid-excel-style-filtering` |',
    );
  });

  it('renders simple components without compound sections', async () => {
    const result = await handleGetComponentDesignTokens({component: 'avatar'});
    const text = result.content[0].text;

    // Should have instruction opening and theme function
    expect(text).toContain('Implement a theme for the `avatar` component using the following guidance.');
    expect(text).toContain('**Theme Function:** `avatar-theme()`');

    // Should have primary tokens
    expect(text).toContain('**Primary Tokens:**');
    expect(text).toContain('- `$background` —');

    // Should have tokens table
    expect(text).toContain('**Available Tokens');

    // Should NOT have compound sections
    expect(text).not.toContain('**Compound Component:**');
    expect(text).not.toContain('**Steps:**');
    expect(text).not.toContain('| Scope | Selector |');
    expect(text).not.toContain('**Token derivations:**');
    expect(text).not.toContain('**Guidance:**');
  });

  it('renders primary tokens from structured data', async () => {
    const result = await handleGetComponentDesignTokens({component: 'calendar'});
    const text = result.content[0].text;

    expect(text).toContain('**Primary Tokens:**');
    expect(text).toContain('- `$header-background` — The main accent color.');
    expect(text).toContain('- `$content-background` — The calendar body background.');
    expect(text).toContain('Text and icon colors are auto-calculated for contrast.');
  });

  it('renders banner with inline scope for both platform groups', async () => {
    const result = await handleGetComponentDesignTokens({component: 'banner'});
    const text = result.content[0].text;

    //Platforms should have inline scope
    expect(text).toContain('**Angular:**');
    expect(text).toContain('**Web Components:**');
    // Banner should have inline scope for both
    expect(text).toContain('| inline | `.igx-banner` |');
    expect(text).toContain('| inline | `igc-banner` |');
  });
});
