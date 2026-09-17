// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  ColorStateController,
  getColorState,
  readColorState,
  setColorState,
  writeColorState,
} from "./state.js";

describe("readColorState", () => {
  it("reads the selection from the hash query", () => {
    expect(readColorState("#/color/shades?preset=fluent&theme=dark")).toEqual({
      preset: "fluent",
      theme: "dark",
      pinned: null,
    });
  });

  it("falls back to material light for anything it does not recognise", () => {
    expect(readColorState("#/color?preset=nope&theme=sepia")).toMatchObject({
      preset: "material",
      theme: "light",
    });
    expect(readColorState("")).toMatchObject({
      preset: "material",
      theme: "light",
    });
  });
});

describe("writeColorState", () => {
  const state = { preset: "bootstrap", theme: "dark", pinned: "100" } as const;

  it("keeps the path and rewrites the query", () => {
    expect(writeColorState("#/color/scales?preset=material", state)).toBe(
      "#/color/scales?preset=bootstrap&theme=dark",
    );
  });

  it("leaves other parameters alone, and never writes the pin", () => {
    expect(writeColorState("#/color?x=1", state)).toBe(
      "#/color?x=1&preset=bootstrap&theme=dark",
    );
  });

  it("starts from the color section when the hash is empty", () => {
    expect(writeColorState("", state)).toBe(
      "#/color?preset=bootstrap&theme=dark",
    );
  });
});

describe("the store", () => {
  it("updates the hash without navigating, and tells its hosts", () => {
    let updates = 0;
    const host = {
      addController() {},
      removeController() {},
      requestUpdate: () => updates++,
      updateComplete: Promise.resolve(true),
    };
    const controller = new ColorStateController(host);
    controller.hostConnected();

    setColorState({ preset: "fluent" });

    expect(getColorState().preset).toBe("fluent");
    expect(controller.value.preset).toBe("fluent");
    expect(location.hash).toContain("preset=fluent");
    expect(updates).toBe(1);

    setColorState({ preset: "fluent" });
    expect(updates).toBe(1);

    controller.hostDisconnected();
    setColorState({ pinned: "50" });
    expect(updates).toBe(1);
  });
});
