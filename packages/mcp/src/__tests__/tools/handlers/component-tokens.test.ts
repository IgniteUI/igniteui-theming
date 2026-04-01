/**
 * Tests for get_component_design_tokens handler.
 */

import { describe, expect, it } from "vitest";
import { handleGetComponentDesignTokens } from "../../../tools/handlers/component-tokens.js";

describe("handleGetComponentDesignTokens", () => {
  it("uses instruction-oriented opening format", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "date-range-picker",
    });
    const text = result.content[0].text;

    expect(text).toContain(
      "Implement a theme for the `date-range-picker` component using the following guidance.",
    );
  });

  it("shows flat related themes list for compound components", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "date-range-picker",
    });
    const text = result.content[0].text;

    expect(text).toContain(
      "**Related themes:** `flat-button`, `input-group`, `calendar`",
    );
    expect(text).toContain(
      "Scope all related themes under the parent component selector:",
    );
  });

  it("shows both Angular and WC platform lines for cross-platform compound", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "date-range-picker",
    });
    const text = result.content[0].text;

    expect(text).toContain("- **Angular:** `igx-date-range-picker`");
    expect(text).toContain(
      "- **Web Components / React / Blazor:** `igc-date-range-picker`",
    );
  });

  it("omits WC platform line for Angular-only compound (time-picker)", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "time-picker",
    });
    const text = result.content[0].text;

    expect(text).toContain("- **Angular:** `igx-time-picker`");
    expect(text).not.toContain("Web Components / React / Blazor");
  });

  it("shows parent selector for grid compound", async () => {
    const result = await handleGetComponentDesignTokens({ component: "grid" });
    const text = result.content[0].text;

    expect(text).toContain("- **Angular:** `igx-grid`");
    expect(text).toContain("- **Web Components / React / Blazor:** `igc-grid`");
  });

  it("resolves theme aliases when theme is missing", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "tree-grid",
    });
    const text = result.content[0].text;

    expect(text).toContain(
      "Implement a theme for the `tree-grid` component using the following guidance.",
    );
    expect(text).toContain("**Theme Function:** `grid-theme()`");
  });

  it("renders simple components without compound sections", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "avatar",
    });
    const text = result.content[0].text;

    // Should have instruction opening and theme function
    expect(text).toContain(
      "Implement a theme for the `avatar` component using the following guidance.",
    );
    expect(text).toContain("**Theme Function:** `avatar-theme()`");

    // Should have primary tokens
    expect(text).toContain("**Primary Tokens:**");
    expect(text).toContain("- `$background` —");

    // Should have tokens table
    expect(text).toContain("**Available Tokens");
  });

  it("renders primary tokens from structured data", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "calendar",
    });
    const text = result.content[0].text;

    expect(text).toContain("**Primary Tokens:**");
    expect(text).toContain("- `$header-background` — The main accent color.");
    expect(text).toContain(
      "- `$content-background` — The calendar body background.",
    );
    expect(text).toContain(
      "Text and icon colors are auto-calculated for contrast.",
    );
  });

  it("renders banner compound with both platform lines", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "banner",
    });
    const text = result.content[0].text;

    expect(text).toContain("**Related themes:** `flat-button`");
    expect(text).toContain("- **Angular:** `igx-banner`");
    expect(text).toContain(
      "- **Web Components / React / Blazor:** `igc-banner`",
    );
  });
});
