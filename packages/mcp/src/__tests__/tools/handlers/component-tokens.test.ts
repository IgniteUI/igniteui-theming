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

  it("shows composed compound guidance", async () => {
    const result = await handleGetComponentDesignTokens({ component: "grid" });
    const text = result.content[0].text;

    expect(text).toContain("**Composed Compound Component:**");
    expect(text).toContain("Do NOT create separate themes");
    expect(text).toContain("**Internally themed children (auto-derived):**");
    expect(text).toContain("`checkbox`");
    expect(text).toContain("`chip`");
    expect(text).not.toContain("Scope all related themes under");
  });

  it("primary tokens table contains only primary token entries", async () => {
    const result = await handleGetComponentDesignTokens({ component: "grid" });
    const text = result.content[0].text;

    // Extract the primary tokens section
    const primarySection =
      text
        .split("\u2705 Primary Tokens")[1]
        ?.split("**Composed Compound Component:**")[0] ?? "";

    // Should contain exactly the 3 primary tokens
    expect(primarySection).toContain("`background`");
    expect(primarySection).toContain("`foreground`");
    expect(primarySection).toContain("`accent-color`");

    // Should NOT contain non-primary tokens
    expect(primarySection).not.toContain("`header-background`");
    expect(primarySection).not.toContain("`row-odd-background`");
  });

  it("available tokens shown as compact name list excluding primary tokens", async () => {
    const result = await handleGetComponentDesignTokens({ component: "grid" });
    const text = result.content[0].text;

    // Should have Available Tokens section with compact name list
    expect(text).toContain("Available Tokens (");
    expect(text).toContain("DO NOT USE unless the user explicitly requests");
    expect(text).toContain("`header-background`");
    expect(text).toContain("`row-hover-background`");

    // Should NOT be a table
    const availableSection = text.split("**Available Tokens")[1] ?? "";
    expect(availableSection).not.toContain("| Token Name |");

    // Primary tokens should NOT appear in the available list
    const availableNames =
      availableSection.match(/`([^`]+)`/g)?.map((m) => m.slice(1, -1)) ?? [];
    expect(availableNames).not.toContain("background");
    expect(availableNames).not.toContain("foreground");
    expect(availableNames).not.toContain("accent-color");
  });

  it("unified format: all components use same primary and available token sections", async () => {
    // Grid (composed), combo (compound), avatar (simple) should all use same headers
    const [gridResult, comboResult, avatarResult] = await Promise.all([
      handleGetComponentDesignTokens({ component: "grid" }),
      handleGetComponentDesignTokens({ component: "combo" }),
      handleGetComponentDesignTokens({ component: "avatar" }),
    ]);

    for (const result of [gridResult, comboResult, avatarResult]) {
      const text = result.content[0].text;

      // All should have unified Primary Tokens header
      expect(text).toContain("\u2705 Primary Tokens");
      expect(text).toContain("Use ONLY these tokens");

      // All should have unified Available Tokens header
      expect(text).toContain("Available Tokens (");
      expect(text).toContain("DO NOT USE unless the user explicitly requests");

      // All should have unified next-step
      expect(text).toContain(
        "Do NOT add available tokens unless the user explicitly asks",
      );
    }
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

    expect(text).toContain("\u2705 Primary Tokens");
    expect(text).toContain("| `background` |");
    expect(text).toContain("Available Tokens");
  });

  it("renders primary tokens from structured data", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "calendar",
    });
    const text = result.content[0].text;

    expect(text).toContain("\u2705 Primary Tokens");
    expect(text).toContain("| `header-background` |");
    expect(text).toContain("| `content-background` |");
    expect(text).toContain(
      "Text and icon colors are auto-calculated for contrast.",
    );
  });

  it("suggests progress-linear for linear progress phrasing", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "linear progress",
    });
    const text = result.content[0].text;

    expect(text).toContain('Component "linear progress" not found.');
    expect(text).toContain("**Similar components:**");

    const suggestions = text.split("**Similar components:**")[1] ?? "";
    expect(suggestions.trimStart().startsWith("- progress-linear")).toBe(true);
  });

  it("suggests progress components for common typo phrasing", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "pogress",
    });
    const text = result.content[0].text;

    expect(text).toContain('Component "pogress" not found.');
    expect(text).toContain("**Similar components:**");
    expect(text).toContain("- progress-circular");
    expect(text).toContain("- progress-linear");
  });

  // ===== Child Component Tests =====

  it("shows relationship note for child component (list-item)", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "list-item",
    });
    const text = result.content[0].text;

    expect(text).toContain("`list-item` is a child of the `list` component");
    expect(text).toContain("styling is controlled through the `list` theme");
  });

  it("shows parent theme function for child component", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "list-item",
    });
    const text = result.content[0].text;

    expect(text).toContain("**Theme Function:** `list-theme()`");
  });

  it("shows parent tokens for child component (unfiltered)", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "list-item",
    });
    const text = result.content[0].text;

    // Should include item-* tokens
    expect(text).toContain("item-background");

    // Should also include header-* tokens (unfiltered)
    expect(text).toContain("header-background");
  });

  it("shows relationship note for nav-drawer-item (naming mismatch case)", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "nav-drawer-item",
    });
    const text = result.content[0].text;

    expect(text).toContain(
      "`nav-drawer-item` is a child of the `navdrawer` component",
    );
    expect(text).toContain("**Theme Function:** `navdrawer-theme()`");
  });

  it("shows relationship note for step child component", async () => {
    const result = await handleGetComponentDesignTokens({
      component: "step",
    });
    const text = result.content[0].text;

    expect(text).toContain("`step` is a child of the `stepper` component");
    expect(text).toContain("**Theme Function:** `stepper-theme()`");
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
