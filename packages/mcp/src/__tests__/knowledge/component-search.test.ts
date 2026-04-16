/**
 * Isolated unit tests for the component search engine.
 *
 * Uses a small synthetic component set so scoring behaviour is tested
 * independently of the real COMPONENT_METADATA / COMPONENT_THEMES data.
 */

import { describe, expect, it } from "vitest";
import type { ComponentMetadata } from "../../knowledge/component-metadata.js";
import { createComponentSearcher } from "../../knowledge/component-search.js";

function buildSearcher(
  metadata: Record<string, ComponentMetadata>,
  extraThemeNames: string[] = [],
) {
  const componentNames = [
    ...new Set([...Object.keys(metadata), ...extraThemeNames]),
  ];
  return createComponentSearcher({ componentNames, metadata });
}

const MINI_METADATA: Record<string, ComponentMetadata> = {
  avatar: {
    selectors: { angular: "igx-avatar", webcomponents: "igc-avatar" },
  },
  switch: {
    selectors: { angular: "igx-switch", webcomponents: "igc-switch" },
    aliases: ["toggle"],
  },
  "progress-linear": {
    selectors: {
      angular: "igx-linear-bar",
      webcomponents: "igc-linear-progress",
    },
  },
  "progress-circular": {
    selectors: {
      angular: "igx-circular-bar",
      webcomponents: "igc-circular-progress",
    },
    aliases: ["spinner"],
  },
  "flat-button": {
    selectors: {
      angular: ".igx-button--flat",
      webcomponents: 'igc-button[variant="flat"]',
    },
  },
  "date-picker": {
    selectors: {
      angular: "igx-date-picker",
      webcomponents: "igc-date-picker",
    },
  },
};

describe("Component Search Engine", () => {
  const searcher = buildSearcher(MINI_METADATA);

  // ===== Normalization =====

  describe("normalization", () => {
    it("returns empty for blank / whitespace / punctuation-only input", () => {
      expect(searcher.search("")).toEqual([]);
      expect(searcher.search("   ")).toEqual([]);
      expect(searcher.search("---")).toEqual([]);
    });

    it("is case-insensitive", () => {
      expect(searcher.search("AVATAR")).toContain("avatar");
    });

    it("treats hyphens, underscores, and spaces as equivalent", () => {
      const a = searcher.search("date-picker");
      const b = searcher.search("date_picker");
      const c = searcher.search("date picker");

      expect(a).toContain("date-picker");
      expect(b).toContain("date-picker");
      expect(c).toContain("date-picker");
    });

    it("strips igx- and igc- framework prefixes", () => {
      const results = searcher.search("igx-linear-bar");
      expect(results[0]).toBe("progress-linear");
    });

    it("strips igx/igc prefix tokens without hyphen", () => {
      const results = searcher.search("igxavatar");
      expect(results).toContain("avatar");
    });
  });

  // ===== Scoring tiers =====

  describe("scoring tiers", () => {
    it("exact normalised match ranks highest", () => {
      const results = searcher.search("avatar");
      expect(results[0]).toBe("avatar");
    });

    it("order-independent token-set match ranks high", () => {
      const results = searcher.search("linear progress");
      expect(results[0]).toBe("progress-linear");
    });

    it("token-coverage match works for partial overlap", () => {
      const results = searcher.search("flat button");
      expect(results[0]).toBe("flat-button");
    });

    it("substring fallback matches concatenated forms", () => {
      const results = searcher.search("datepicker");
      expect(results).toContain("date-picker");
    });

    it("short single tokens (< 4 chars) are filtered out", () => {
      expect(searcher.search("bar")).toEqual([]);
      expect(searcher.search("nav")).toEqual([]);
    });
  });

  // ===== Synonym aliases =====

  describe("synonym aliases", () => {
    it("resolves explicit synonym to canonical name", () => {
      const results = searcher.search("toggle");
      expect(results[0]).toBe("switch");
    });

    it("resolves multi-signal aliases", () => {
      const results = searcher.search("spinner");
      expect(results[0]).toBe("progress-circular");
    });
  });

  // ===== Selector matching =====

  describe("selector signals", () => {
    it("matches angular selector as search signal", () => {
      const results = searcher.search("igx-circular-bar");
      expect(results[0]).toBe("progress-circular");
    });

    it("matches web components selector", () => {
      const results = searcher.search("igc-linear-progress");
      expect(results[0]).toBe("progress-linear");
    });

    it("handles selector with attribute syntax", () => {
      const results = searcher.search('igc-button[variant="flat"]');
      expect(results).toContain("flat-button");
    });
  });

  // ===== Typo recovery =====

  describe("typo recovery", () => {
    it("recovers single-char typo for tokens >= 5 chars", () => {
      const results = searcher.search("avatr");
      expect(results).toContain("avatar");
    });

    it("does not fire for short tokens (< 5 chars)", () => {
      expect(searcher.search("swch")).toEqual([]);
    });

    it("does not recover distance-2 typos", () => {
      expect(searcher.search("pogrss")).toEqual([]);
    });

    it("ranks typo matches below exact matches", () => {
      const exact = searcher.search("avatar");
      const typo = searcher.search("avatr");

      expect(exact[0]).toBe("avatar");
      expect(typo).toContain("avatar");
    });
  });

  // ===== Determinism =====

  describe("determinism", () => {
    it("returns identical results across repeated calls", () => {
      const a = searcher.search("progress");
      const b = searcher.search("progress");
      expect(a).toEqual(b);
    });

    it("breaks ties lexicographically", () => {
      const results = searcher.search("progress");
      const progressEntries = results.filter((r) => r.startsWith("progress-"));

      expect(progressEntries).toEqual([...progressEntries].sort());
    });
  });

  // ===== Edge cases =====

  describe("edge cases", () => {
    it("deduplicates repeated tokens in query", () => {
      const single = searcher.search("avatar");
      const doubled = searcher.search("avatar avatar");
      expect(doubled).toEqual(single);
    });

    it("returns empty for gibberish", () => {
      expect(searcher.search("xyznonexistent123")).toEqual([]);
    });

    it("returns empty for very long unrelated query", () => {
      expect(
        searcher.search("this query has nothing to do with any component"),
      ).toEqual([]);
    });
  });
});
