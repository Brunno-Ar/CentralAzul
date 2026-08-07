import { describe, it, expect } from "vitest";
import { mockCompanies } from "@/lib/db";

describe("mockCompanies compatibility (T3 not-do)", () => {
  it("should still exist and be non-empty", () => {
    expect(Array.isArray(mockCompanies)).toBe(true);
    expect(mockCompanies.length).toBeGreaterThan(0);
  });
});
