import { describe, expect, it } from "vitest";
import { createInstagramReportProfile } from "@/lib/instagram-report";
import type { PortalConta, PortalOrganicoData } from "@/lib/portal-api";

describe("createInstagramReportProfile", () => {
  it("reports when the portal returns an organic highlights error", () => {
    const account: PortalConta = {
      id: "account-1",
      nome: "Perfil de teste",
      tipo: "instagram",
      variante: "completo",
      primeiro_mes: "2026-01",
    };
    const responses = new Map<string, PortalOrganicoData | Error>([
      ["account-1:2026-10", { organico: { username: "perfil", posts: [], stories: [] } }],
    ]);

    const profile = createInstagramReportProfile(
      account,
      ["2026-10"],
      responses,
      { top: { erro: "Falha retornada pelo portal" } },
    );

    expect(profile.highlightWarnings).toContain("Destaques orgânicos indisponíveis neste período.");
  });
});
