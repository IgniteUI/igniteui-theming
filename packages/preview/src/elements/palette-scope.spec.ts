// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { define } from "../define.js";
import { PaletteScope } from "./palette-scope.js";

describe("ig-palette-scope", () => {
  const scope = () => document.createElement("ig-palette-scope");

  it("applies its palette as inline custom properties", () => {
    const element = scope();
    element.vars = { "--ig-primary-500": "#09f" };

    expect(element.style.getPropertyValue("--ig-primary-500")).toBe("#09f");
  });

  it("removes properties the next palette no longer carries", () => {
    const element = scope();
    element.vars = { "--ig-primary-500": "#09f", "--ig-gray-500": "#888" };
    element.vars = { "--ig-primary-500": "#f90" };

    expect(element.style.getPropertyValue("--ig-primary-500")).toBe("#f90");
    expect(element.style.getPropertyValue("--ig-gray-500")).toBe("");
    expect(element.vars).toEqual({ "--ig-primary-500": "#f90" });
  });
});

describe("define", () => {
  it("keeps the first definition rather than throwing on a repeat", () => {
    class Other extends HTMLElement {}

    expect(() => define("ig-palette-scope", Other)).not.toThrow();
    expect(customElements.get("ig-palette-scope")).toBe(PaletteScope);
  });
});
