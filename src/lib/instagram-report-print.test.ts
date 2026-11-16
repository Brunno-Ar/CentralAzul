import { describe, expect, it } from "vitest";
import { createMapleBearManualProfile, applyMapleBearManualPeriodCounts } from "@/lib/manual-instagram-data";
import { createInstagramReportData, type InstagramReportProfile } from "@/lib/instagram-report";
import { renderInstagramReportHtml } from "@/lib/instagram-report-print";

function createReport() {
  const mapleBearProfile = createMapleBearManualProfile(["2026-11"], {
    from: "2026-11-09",
    to: "2026-11-15",
  });
  const portalProfile: InstagramReportProfile = {
    id: "portal-account",
    name: "Perfil Portal",
    username: "perfilportal",
    months: {
      "2026-11": { photos: 1, carousels: 0, reels: 2, stories: 3, available: true },
    },
    totals: { photos: 1, carousels: 0, reels: 2, stories: 3 },
    periodAvailable: true,
    topHighlights: [],
    highlightWarnings: [],
  };

  return createInstagramReportData("2026-11", "2026-11", [portalProfile, mapleBearProfile], ["2026-11"], {
    mode: "days",
    referenceMonth: "2026-11",
    startDate: "2026-11-09",
    endDate: "2026-11-15",
    scopeLabel: "Todas as unidades",
  });
}

describe("renderInstagramReportHtml com contagens manuais da Maple Bear", () => {
  it("inclui as quantidades completas de feed e stories no resumo e no perfil", () => {
    const report = applyMapleBearManualPeriodCounts(createReport(), { feed: 5, stories: 7 });
    const html = renderInstagramReportHtml(report);

    expect(html).toContain("<strong>18</strong><span>Peças registradas</span>");
    expect(html).toContain("<strong>8</strong><span>Publicações no feed</span>");
    expect(html).toContain("<strong>10</strong><span>Stories</span>");
    expect(html).toContain('<td class="muted">N/D</td><td class="muted">N/D</td><td class="muted">N/D</td><td>5</td><td>7</td><td>12</td>');
    expect(html).toContain("Total disponível (2/2 perfis)");
  });

  it("marca como indisponíveis os dados não informados quando só um campo é preenchido", () => {
    const report = applyMapleBearManualPeriodCounts(createReport(), { feed: 5, stories: null });
    const html = renderInstagramReportHtml(report);

    expect(html).toContain("<strong>N/D</strong><span>Peças registradas</span>");
    expect(html).toContain("<strong>8</strong><span>Publicações no feed</span>");
    expect(html).toContain("<strong>N/D</strong><span>Stories</span>");
    expect(html).toContain('<td class="muted">N/D</td><td class="muted">N/D</td><td class="muted">N/D</td><td>5</td><td>N/D</td><td>N/D</td>');
  });

  it("mantém as contagens diárias indisponíveis quando os dois campos estão vazios", () => {
    const report = applyMapleBearManualPeriodCounts(createReport(), { feed: null, stories: null });
    const html = renderInstagramReportHtml(report);

    expect(html).toContain("Contagens diárias não disponíveis neste levantamento");
    expect(html).toContain("Total disponível (1/2 perfis)");
    expect(html).toContain("<strong>6</strong><span>Peças registradas</span>");
  });
});
