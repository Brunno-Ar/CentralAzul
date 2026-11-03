import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  fetchPortalContas,
  fetchPortalOrganico,
  fetchPortalOrganicoTop,
  fetchPortalReport,
  getPortalToken,
} from "@/lib/portal-api";
import { GET } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/portal-api", () => ({
  fetchPortalContas: vi.fn(),
  fetchPortalOrganico: vi.fn(),
  fetchPortalOrganicoTop: vi.fn(),
  fetchPortalReport: vi.fn(),
  getPortalToken: vi.fn(),
}));

describe("GET /api/portal/instagram-report", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(rateLimit).mockResolvedValue(null);
    vi.mocked(fetchPortalContas).mockResolvedValue([{
      id: "portal-account-1",
      nome: "Perfil do Portal",
      tipo: "instagram",
      variante: "completo",
      primeiro_mes: "2026-01",
    }]);
    vi.mocked(getPortalToken).mockResolvedValue("token");
    vi.mocked(fetchPortalOrganico).mockRejectedValue(new Error("Portal indisponível"));
    vi.mocked(fetchPortalOrganicoTop).mockResolvedValue({ top: { posts: [], stories: [] } });
    vi.mocked(fetchPortalReport).mockResolvedValue({ criativos: [] } as never);
  });

  it("returns an error when all Portal profiles fail even if Maple Bear has manual data", async () => {
    const request = new NextRequest("http://localhost/api/portal/instagram-report?from=2026-07&to=2026-09");

    const response = await GET(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      error: "O Portal CP não retornou dados orgânicos para este período. Tente novamente mais tarde.",
    });
  });
});
