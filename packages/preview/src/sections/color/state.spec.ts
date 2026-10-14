// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  ColorStateController,
  ColorStore,
  pageColorStore,
  readColorState,
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

const fakeHost = (store?: ColorStore) => {
  const host = {
    updates: 0,
    store,
    addController() {},
    removeController() {},
    requestUpdate() {
      host.updates++;
    },
    updateComplete: Promise.resolve(true),
  };
  return host;
};

describe("the page store", () => {
  it("updates the hash without navigating, and tells its hosts", () => {
    const host = fakeHost();
    const controller = new ColorStateController(host);
    controller.hostConnected();

    pageColorStore().set({ preset: "fluent" });

    expect(pageColorStore().value.preset).toBe("fluent");
    expect(controller.value.preset).toBe("fluent");
    expect(location.hash).toContain("preset=fluent");
    expect(host.updates).toBe(1);

    pageColorStore().set({ preset: "fluent" });
    expect(host.updates).toBe(1);

    controller.hostDisconnected();
    pageColorStore().set({ pinned: "50" });
    expect(host.updates).toBe(1);
  });
});

describe("a local store", () => {
  it("never touches the address bar", () => {
    const before = location.href;
    const store = new ColorStore();
    const host = fakeHost(store);
    const controller = new ColorStateController(host);
    controller.hostConnected();

    controller.set({ preset: "bootstrap", theme: "dark" });

    expect(location.href).toBe(before);
    expect(store.value).toMatchObject({ preset: "bootstrap", theme: "dark" });
    expect(host.updates).toBe(1);
  });

  it("is independent of other stores", () => {
    const a = new ColorStore();
    const b = new ColorStore();
    const host = fakeHost(b);
    new ColorStateController(host).hostConnected();

    a.set({ pinned: "100" });

    expect(b.value.pinned).toBeNull();
    expect(host.updates).toBe(0);
  });
});
