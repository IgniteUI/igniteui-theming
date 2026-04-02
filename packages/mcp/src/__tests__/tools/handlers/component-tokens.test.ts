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
