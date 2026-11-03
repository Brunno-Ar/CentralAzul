import { describe, expect, it } from "vitest";
import { createMapleBearManualProfile } from "@/lib/manual-instagram-data";

describe("createMapleBearManualProfile", () => {
  it("ranked highlights only from the selected months", () => {
    const profile = createMapleBearManualProfile(["2026-08"]);

    expect(profile.topHighlights).toHaveLength(5);
    expect(profile.topHighlights.map((highlight) => highlight.views)).toEqual([1049, 651, 539, 504, 493]);
    expect(profile.topHighlights.every((highlight) => highlight.date?.startsWith("2026-08-") ?? false)).toBe(true);
  });
});
