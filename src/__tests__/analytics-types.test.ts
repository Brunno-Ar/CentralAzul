import { describe, it, expect } from "vitest";
import type {
  AnalyticsProvider,
  ProviderId,
  UnifiedAnalyticsMetric,
  ProviderResult,
  ProviderStatus,
  SyncResult,
  SyncStatus,
} from "@/lib/analytics/types";

describe("Analytics types - shape validation", () => {
  it("ProviderId inclui todos os providers esperados", () => {
    const validIds: ProviderId[] = [
      "google_analytics",
      "meta",
      "youtube_data",
      "youtube_analytics",
      "mock",
    ];

    for (const id of validIds) {
      expect(id).toBeTruthy();
    }
  });

  it("UnifiedAnalyticsMetric tem campos opcionais corretos", () => {
    const minimalMetric: UnifiedAnalyticsMetric = {
      businessUnitId: "bu-1",
      date: new Date(),
      source: "mock",
    };

    expect(minimalMetric.pageViews).toBeUndefined();
    expect(minimalMetric.followersCount).toBeUndefined();

    const fullMetric: UnifiedAnalyticsMetric = {
      businessUnitId: "bu-1",
      date: new Date(),
      source: "google_analytics",
      pageViews: 1000,
      uniqueVisitors: 800,
      sessions: 900,
      bounceRate: 45.5,
      avgSessionDuration: 120,
    };

    expect(fullMetric.pageViews).toBe(1000);
    expect(fullMetric.sessions).toBe(900);
  });

  it("ProviderResult identifica dados mock vs real", () => {
    const mockResult: ProviderResult = {
      metrics: [],
      fetchedAt: new Date(),
      isMock: true,
      warnings: ["Dados simulados"],
    };

    const realResult: ProviderResult = {
      metrics: [],
      fetchedAt: new Date(),
      isMock: false,
    };

    expect(mockResult.isMock).toBe(true);
    expect(realResult.isMock).toBe(false);
  });

  it("SyncResult tem estrutura valida para sucesso e erro", () => {
    const successResult: SyncResult = {
      providerId: "google_analytics",
      businessUnitId: "bu-1",
      status: "success",
      metricsCount: 42,
      duration: 1500,
    };

    const errorResult: SyncResult = {
      providerId: "meta",
      businessUnitId: "bu-1",
      status: "error",
      metricsCount: 0,
      duration: 3000,
      errorMessage: "Token expirado",
    };

    expect(successResult.status).toBe("success");
    expect(successResult.warnings).toBeUndefined();

    expect(errorResult.status).toBe("error");
    expect(errorResult.errorMessage).toBe("Token expirado");
  });

  it("ProviderStatus rastreia ultima sincronizacao", () => {
    const configuredStatus: ProviderStatus = {
      providerId: "google_analytics",
      displayName: "Google Analytics",
      isConfigured: true,
      isEnabled: true,
      lastSyncAt: new Date("2026-01-01T00:00:00Z"),
      lastSyncStatus: "success",
    };

    const notConfiguredStatus: ProviderStatus = {
      providerId: "youtube_analytics",
      displayName: "YouTube Analytics",
      isConfigured: false,
      isEnabled: false,
      lastSyncAt: null,
      lastSyncStatus: "never",
    };

    expect(configuredStatus.isConfigured).toBe(true);
    expect(configuredStatus.lastSyncStatus).toBe("success");

    expect(notConfiguredStatus.isConfigured).toBe(false);
    expect(notConfiguredStatus.lastSyncAt).toBeNull();
    expect(notConfiguredStatus.lastSyncStatus).toBe("never");
  });
});

describe("Analytics registry - import smoke test", () => {
  it("getProviderRegistry retorna instancia com todos providers", async () => {
    const { getProviderRegistry } = await import("@/lib/analytics/registry");
    const registry = getProviderRegistry();

    const allProviders = registry.list();
    expect(allProviders.length).toBeGreaterThanOrEqual(5);

    const ids = allProviders.map((p) => p.providerId);
    expect(ids).toContain("google_analytics");
    expect(ids).toContain("meta");
    expect(ids).toContain("youtube_data");
    expect(ids).toContain("youtube_analytics");
    expect(ids).toContain("mock");
  });

  it("registry.get retorna o provider correto", async () => {
    const { getProviderRegistry } = await import("@/lib/analytics/registry");
    const registry = getProviderRegistry();

    const ga = registry.get("google_analytics");
    expect(ga).toBeDefined();
    expect(ga?.providerId).toBe("google_analytics");
    expect(ga?.authMethod).toBe("service_account");

    const mock = registry.get("mock");
    expect(mock).toBeDefined();
    expect(mock?.authMethod).toBe("none");
  });
});
