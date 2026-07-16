import { describe, it, expect } from "vitest";
import {
  generateDashboardMockData,
  mulberry32,
  hashSeed,
  DEFAULT_FILTERS,
  PERIOD_LABELS,
  UNIT_OPTIONS,
  PLATFORM_OPTIONS,
  type MetricasFilters,
} from "@/lib/mock/dashboard-metrics";

// ---------------------------------------------------------------
// PRNG (mesma suite de testes do analytics-providers.test.ts,
// adaptada para o dashboard-metrics)
// ---------------------------------------------------------------

describe("mulberry32 (dashboard-metrics)", () => {
  it("produz valores deterministicos para a mesma seed", () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).toEqual(seq2);
  });

  it("produz valores diferentes para seeds diferentes", () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(54321);

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).not.toEqual(seq2);
  });

  it("gera valores entre 0 e 1", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe("hashSeed (dashboard-metrics)", () => {
  it("produz o mesmo hash para a mesma string", () => {
    expect(hashSeed("borgo")).toEqual(hashSeed("borgo"));
  });

  it("produz hashes diferentes para strings diferentes", () => {
    expect(hashSeed("borgo")).not.toEqual(hashSeed("maple"));
  });

  it("retorna um numero positivo", () => {
    const h = hashSeed("test-string");
    expect(h).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------
// generateDashboardMockData
// ---------------------------------------------------------------

describe("generateDashboardMockData", () => {
  it("gera dados estruturalmente validos com filtros padrao", () => {
    const data = generateDashboardMockData(DEFAULT_FILTERS);

    // KPIs: 8 metricas
    expect(data.kpis).toBeDefined();
    expect(data.kpis.receitaTotal).toBeDefined();
    expect(data.kpis.receitaMensal).toBeDefined();
    expect(data.kpis.seguidoresTotais).toBeDefined();
    expect(data.kpis.crescimento).toBeDefined();
    expect(data.kpis.engagementMedio).toBeDefined();
    expect(data.kpis.visualizacoes).toBeDefined();
    expect(data.kpis.alcance).toBeDefined();
    expect(data.kpis.ultimaSincronizacao).toBeDefined();
  });

  it("cada KPI tem value, previousValue, change e changeLabel", () => {
    const data = generateDashboardMockData(DEFAULT_FILTERS);
    const kpiKeys = [
      "receitaTotal",
      "receitaMensal",
      "seguidoresTotais",
      "crescimento",
      "engagementMedio",
      "visualizacoes",
      "alcance",
    ] as const;

    for (const key of kpiKeys) {
      const kpi = data.kpis[key];
      expect(typeof kpi.value).toBe("string");
      expect(kpi.value.length).toBeGreaterThan(0);
      expect(typeof kpi.previousValue).toBe("string");
      expect(typeof kpi.change).toBe("number");
      expect(typeof kpi.changeLabel).toBe("string");
      expect(kpi.changeLabel.length).toBeGreaterThan(0);
    }
  });

  it("ultimaSincronizacao tem change zero e sem previousValue numerico", () => {
    const data = generateDashboardMockData(DEFAULT_FILTERS);
    expect(data.kpis.ultimaSincronizacao.change).toBe(0);
    expect(data.kpis.ultimaSincronizacao.previousValue).toBe("-");
  });

  it("gera series temporais para periodo de 7 dias", () => {
    const data = generateDashboardMockData({ ...DEFAULT_FILTERS, period: 7 });
    expect(data.receitaSeries).toHaveLength(7);
    expect(data.seguidoresSeries).toHaveLength(7);
    expect(data.engagementSeries).toHaveLength(7);
  });

  it("gera series temporais para periodo de 30 dias", () => {
    const data = generateDashboardMockData({ ...DEFAULT_FILTERS, period: 30 });
    expect(data.receitaSeries).toHaveLength(30);
  });

  it("gera series temporais para periodo de 90 dias (12 semanas)", () => {
    const data = generateDashboardMockData({ ...DEFAULT_FILTERS, period: 90 });
    expect(data.receitaSeries).toHaveLength(12);
  });

  it("gera series temporais para periodo de 365 dias (12 meses)", () => {
    const data = generateDashboardMockData({ ...DEFAULT_FILTERS, period: 365 });
    expect(data.receitaSeries).toHaveLength(12);
  });

  it("gera metricas para todas as unidades quando unit=all", () => {
    const data = generateDashboardMockData({ ...DEFAULT_FILTERS, unit: "all" });
    expect(data.unitMetrics.length).toBe(4);
    expect(data.unitMetrics[0]).toHaveProperty("slug");
    expect(data.unitMetrics[0]).toHaveProperty("name");
    expect(data.unitMetrics[0]).toHaveProperty("receita");
    expect(data.unitMetrics[0]).toHaveProperty("seguidores");
    expect(data.unitMetrics[0]).toHaveProperty("crescimento");
    expect(data.unitMetrics[0]).toHaveProperty("engagement");
  });

  it("filtra metricas por unidade selecionada", () => {
    const data = generateDashboardMockData({ ...DEFAULT_FILTERS, unit: "BORGO" });
    expect(data.unitMetrics).toHaveLength(1);
    expect(data.unitMetrics[0].slug).toBe("BORGO");
  });

  it("gera distribuicao para todas as plataformas quando platform=all", () => {
    const data = generateDashboardMockData({ ...DEFAULT_FILTERS, platform: "all" });
    expect(data.platformDistribution.length).toBe(6);
    expect(data.platformDistribution[0]).toHaveProperty("platform");
    expect(data.platformDistribution[0]).toHaveProperty("percentage");
    expect(data.platformDistribution[0]).toHaveProperty("value");
  });

  it("filtra distribuicao por plataforma selecionada", () => {
    const data = generateDashboardMockData({ ...DEFAULT_FILTERS, platform: "instagram" });
    expect(data.platformDistribution).toHaveLength(1);
    expect(data.platformDistribution[0].platform).toBe("Instagram");
  });

  it("e deterministico: mesma seed produz mesmos dados", () => {
    const data1 = generateDashboardMockData(DEFAULT_FILTERS);
    const data2 = generateDashboardMockData(DEFAULT_FILTERS);

    // KPIs sao deterministicos
    expect(data1.kpis.receitaTotal.raw).toEqual(data2.kpis.receitaTotal.raw);
    expect(data1.kpis.seguidoresTotais.raw).toEqual(data2.kpis.seguidoresTotais.raw);

    // Series temporais: label e value sao deterministicos.
    // O campo date inclui timestamp atual e nao e deterministico.
    data1.receitaSeries.forEach((point1, i) => {
      expect(point1.label).toEqual(data2.receitaSeries[i].label);
      expect(point1.value).toEqual(data2.receitaSeries[i].value);
    });

    // Metricas de unidade e distribuicao sao deterministicos
    expect(data1.unitMetrics).toEqual(data2.unitMetrics);
    expect(
      data1.platformDistribution.map((p) => ({
        platform: p.platform,
        percentage: p.percentage,
      })),
    ).toEqual(
      data2.platformDistribution.map((p) => ({
        platform: p.platform,
        percentage: p.percentage,
      })),
    );
  });

  it("dados diferentes para filtros diferentes", () => {
    const data1 = generateDashboardMockData({ ...DEFAULT_FILTERS, period: 7 });
    const data2 = generateDashboardMockData({ ...DEFAULT_FILTERS, period: 365 });

    expect(data1.kpis.receitaTotal.raw).not.toEqual(data2.kpis.receitaTotal.raw);
  });

  it("inclui os filtros ativos no resultado", () => {
    const filters: MetricasFilters = { period: 90, unit: "AZUL", platform: "youtube" };
    const data = generateDashboardMockData(filters);
    expect(data.filters).toEqual(filters);
  });
});

// ---------------------------------------------------------------
// Constantes exportadas
// ---------------------------------------------------------------

describe("Constantes exportadas", () => {
  it("PERIOD_LABELS tem rotulos para 7, 30, 90 e 365", () => {
    expect(PERIOD_LABELS[7]).toBeDefined();
    expect(PERIOD_LABELS[30]).toBeDefined();
    expect(PERIOD_LABELS[90]).toBeDefined();
    expect(PERIOD_LABELS[365]).toBeDefined();
  });

  it("UNIT_OPTIONS inclui 'all' e todas as unidades", () => {
    const values = UNIT_OPTIONS.map((u) => u.value);
    expect(values).toContain("all");
    expect(values).toContain("BORGO");
    expect(values).toContain("MAPLE_BEAR");
    expect(values).toContain("AZUL");
    expect(values).toContain("COMP-GRAN-RESERVA");
  });

  it("PLATFORM_OPTIONS inclui 'all' e todas as plataformas", () => {
    const values = PLATFORM_OPTIONS.map((p) => p.value);
    expect(values).toContain("all");
    expect(values).toContain("instagram");
    expect(values).toContain("facebook");
    expect(values).toContain("youtube");
    expect(values).toContain("tiktok");
    expect(values).toContain("site");
    expect(values).toContain("outros");
  });
});
