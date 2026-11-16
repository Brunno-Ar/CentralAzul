import { describe, expect, it } from "vitest";
import {
  applyMapleBearManualPeriodCounts,
  createMapleBearManualProfile,
  parseOptionalManualCount,
} from "@/lib/manual-instagram-data";
import { createInstagramReportData } from "@/lib/instagram-report";

describe("createMapleBearManualProfile", () => {
  it("ranked highlights only from the selected months", () => {
    const profile = createMapleBearManualProfile(["2026-08"]);

    expect(profile.topHighlights).toHaveLength(5);
    expect(profile.topHighlights.map((highlight) => highlight.views)).toEqual([1049, 651, 539, 504, 493]);
    expect(profile.topHighlights.every((highlight) => highlight.date?.startsWith("2026-08-") ?? false)).toBe(true);
  });
});

describe("parseOptionalManualCount", () => {
  it("aceita campos vazios e quantidades inteiras não negativas", () => {
    expect(parseOptionalManualCount("")).toBeNull();
    expect(parseOptionalManualCount("   ")).toBeNull();
    expect(parseOptionalManualCount("0")).toBe(0);
    expect(parseOptionalManualCount("12")).toBe(12);
  });

  it("rejeita quantidades negativas, fracionárias ou fora do limite seguro", () => {
    expect(parseOptionalManualCount("-1")).toBeUndefined();
    expect(parseOptionalManualCount("1.5")).toBeUndefined();
    expect(parseOptionalManualCount("9007199254740992")).toBeUndefined();
  });
});

describe("applyMapleBearManualPeriodCounts", () => {
  function createReport() {
    const profile = createMapleBearManualProfile(["2026-11"], {
      from: "2026-11-09",
      to: "2026-11-15",
    });

    return createInstagramReportData("2026-11", "2026-11", [profile], ["2026-11"], {
      mode: "days",
      referenceMonth: "2026-11",
      startDate: "2026-11-09",
      endDate: "2026-11-15",
      scopeLabel: "Instagram - Maple Bear",
    });
  }

  it("aplica as contagens do período sem alterar o relatório original", () => {
    const report = createReport();
    const updatedReport = applyMapleBearManualPeriodCounts(report, { feed: 8, stories: 13 });

    expect(updatedReport).not.toBe(report);
    expect(updatedReport.profiles[0].periodAvailable).toBe(true);
    expect(updatedReport.profiles[0].manualPeriodCounts).toEqual({ feed: 8, stories: 13 });
    expect(report.profiles[0].periodAvailable).toBe(false);
    expect(report.profiles[0].manualPeriodCounts).toBeUndefined();
  });

  it("mantém o relatório original quando os dois campos estão vazios", () => {
    const report = createReport();

    expect(applyMapleBearManualPeriodCounts(report, { feed: null, stories: null })).toBe(report);
    expect(report.profiles[0].periodAvailable).toBe(false);
  });
});
