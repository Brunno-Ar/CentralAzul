/**
 * Dados mock deterministicos para o Dashboard de Metricas.
 *
 * Reutiliza a abordagem de seeded PRNG (mulberry32 + hashSeed) ja usada
 * em db.ts e mock-provider.ts para garantir valores consistentes
 * entre renders e hot reloads.
 */

// ---------------------------------------------------------------
// PRNG (mesma implementacao de db.ts / mock-provider.ts)
// ---------------------------------------------------------------

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

// ---------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------

export interface MockKPI {
  /** Valor principal formatado para exibicao */
  value: string;
  /** Valor numerico bruto (para calculos futuros) */
  raw: number;
  /** Valor do periodo anterior formatado para exibicao */
  previousValue: string;
  /** Valor numerico bruto do periodo anterior */
 previousRaw: number;
  /** Percentual de cambio em relacao ao periodo anterior */
  change: number;
  /** Descricao do periodo comparado */
  changeLabel: string;
}

export interface MockTimeSeriesPoint {
  date: string;
  label: string;
  value: number;
}

export interface MockUnitMetric {
  slug: string;
  name: string;
  receita: number;
  seguidores: number;
  crescimento: number;
  engagement: number;
}

export interface MockPlatformDistribution {
  platform: string;
  percentage: number;
  value: number;
}

// ---------------------------------------------------------------
// Filtros globais (Bloco 5.3)
// ---------------------------------------------------------------

export type PeriodFilter = 7 | 30 | 90 | 365 | "custom";
export type PlatformFilter = "all" | "instagram" | "facebook" | "youtube" | "tiktok" | "site" | "outros";
export type UnitFilter = "all" | string;

export interface MetricasFilters {
  period: PeriodFilter;
  customStartDate?: string;
  customEndDate?: string;
  unit: UnitFilter;
  platform: PlatformFilter;
}

export const DEFAULT_FILTERS: MetricasFilters = {
  period: 30,
  unit: "all",
  platform: "all",
};

export const PERIOD_LABELS: Record<Exclude<PeriodFilter, "custom">, string> = {
  7: "7 dias",
  30: "30 dias",
  90: "90 dias",
  365: "365 dias",
};

export const UNIT_OPTIONS = [
  { value: "all", label: "Todas as Unidades" },
  { value: "BORGO", label: "Borgo del Vino" },
  { value: "MAPLE_BEAR", label: "Maple Bear" },
  { value: "AZUL", label: "Grupo Azul" },
  { value: "COMP-GRAN-RESERVA", label: "Gran Reserva" },
];

export const PLATFORM_OPTIONS = [
  { value: "all", label: "Todas as Plataformas" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "site", label: "Site" },
  { value: "outros", label: "Outros" },
];

export interface DashboardMockData {
  kpis: {
    receitaTotal: MockKPI;
    receitaMensal: MockKPI;
    seguidoresTotais: MockKPI;
    crescimento: MockKPI;
    engagementMedio: MockKPI;
    visualizacoes: MockKPI;
    alcance: MockKPI;
    ultimaSincronizacao: MockKPI;
  };
  /** Serie temporal de receita - placeholder para grafico de linhas */
  receitaSeries: MockTimeSeriesPoint[];
  /** Serie temporal de seguidores - placeholder para grafico de area */
  seguidoresSeries: MockTimeSeriesPoint[];
  /** Serie temporal de engagement - placeholder para grafico de barras */
  engagementSeries: MockTimeSeriesPoint[];
  /** Metricas por unidade de negocio - placeholder para graficos comparativos */
  unitMetrics: MockUnitMetric[];
  /** Distribuicao por plataforma - placeholder para grafico de pizza/donut */
  platformDistribution: MockPlatformDistribution[];
  /** Filtros ativos usados para gerar estes dados */
  filters: MetricasFilters;
}

// ---------------------------------------------------------------
// Geracao de dados
// ---------------------------------------------------------------

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(1) + "K";
  return value.toLocaleString("pt-BR");
}

function formatPercent(value: number): string {
  return value.toFixed(1) + "%";
}

function formatDateLabel(): string {
  const now = new Date();
  return now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateDashboardMockData(
  filters: MetricasFilters = DEFAULT_FILTERS,
): DashboardMockData {
  // Seed deterministico que varia com os filtros selecionados
  const filterKey = `${filters.period}-${filters.unit}-${filters.platform}-${filters.customStartDate ?? ""}-${filters.customEndDate ?? ""}`;
  const rng = mulberry32(hashSeed(`dashboard-metricas-${filterKey}`));

  /**
   * Calcula o valor do periodo anterior a partir do valor atual e do
   * percentual de cambio. Garante consistencia matematica entre o
   * valor atual, o valor anterior e o indicador de crescimento/queda.
   */
  function calcPrevious(currentRaw: number, changePct: number): number {
    return Math.round(currentRaw / (1 + changePct / 100));
  }

  // KPIs com cambio percentual em relacao ao periodo anterior
  const receitaTotalRaw = randInt(rng, 480000, 750000);
  const receitaTotalChange = randFloat(rng, 5.2, 22.8);
  const receitaTotalPrev = calcPrevious(receitaTotalRaw, receitaTotalChange);

  const receitaMensalRaw = randInt(rng, 35000, 85000);
  const receitaMensalChange = randFloat(rng, -8.5, 15.2);
  const receitaMensalPrev = calcPrevious(receitaMensalRaw, receitaMensalChange);

  const seguidoresTotaisRaw = randInt(rng, 28000, 52000);
  const seguidoresChange = randFloat(rng, 1.8, 12.3);
  const seguidoresPrev = calcPrevious(seguidoresTotaisRaw, seguidoresChange);

  const crescimentoRaw = randFloat(rng, 3.5, 18.5);
  const crescimentoChange = randFloat(rng, -3.2, 8.5);
  const crescimentoPrev = Math.round((crescimentoRaw / (1 + crescimentoChange / 100)) * 10) / 10;

  const engagementMedioRaw = randFloat(rng, 2.1, 7.8);
  const engagementChange = randFloat(rng, -1.5, 9.8);
  const engagementPrev = Math.round((engagementMedioRaw / (1 + engagementChange / 100)) * 10) / 10;

  const visualizacoesRaw = randInt(rng, 120000, 480000);
  const visualizacoesChange = randFloat(rng, 2.1, 19.6);
  const visualizacoesPrev = calcPrevious(visualizacoesRaw, visualizacoesChange);

  const alcanceRaw = randInt(rng, 95000, 310000);
  const alcanceChange = randFloat(rng, -5.0, 14.3);
  const alcancePrev = calcPrevious(alcanceRaw, alcanceChange);

  const kpis = {
    receitaTotal: {
      value: formatCurrency(receitaTotalRaw),
      raw: receitaTotalRaw,
      previousValue: formatCurrency(receitaTotalPrev),
      previousRaw: receitaTotalPrev,
      change: receitaTotalChange,
      changeLabel: "vs. periodo anterior",
    } satisfies MockKPI,
    receitaMensal: {
      value: formatCurrency(receitaMensalRaw),
      raw: receitaMensalRaw,
      previousValue: formatCurrency(receitaMensalPrev),
      previousRaw: receitaMensalPrev,
      change: receitaMensalChange,
      changeLabel: "vs. mes anterior",
    } satisfies MockKPI,
    seguidoresTotais: {
      value: formatNumber(seguidoresTotaisRaw),
      raw: seguidoresTotaisRaw,
      previousValue: formatNumber(seguidoresPrev),
      previousRaw: seguidoresPrev,
      change: seguidoresChange,
      changeLabel: "vs. 30 dias anteriores",
    } satisfies MockKPI,
    crescimento: {
      value: formatPercent(crescimentoRaw),
      raw: crescimentoRaw,
      previousValue: formatPercent(crescimentoPrev),
      previousRaw: crescimentoPrev,
      change: crescimentoChange,
      changeLabel: "vs. trimestre anterior",
    } satisfies MockKPI,
    engagementMedio: {
      value: formatPercent(engagementMedioRaw),
      raw: engagementMedioRaw,
      previousValue: formatPercent(engagementPrev),
      previousRaw: engagementPrev,
      change: engagementChange,
      changeLabel: "vs. 30 dias anteriores",
    } satisfies MockKPI,
    visualizacoes: {
      value: formatNumber(visualizacoesRaw),
      raw: visualizacoesRaw,
      previousValue: formatNumber(visualizacoesPrev),
      previousRaw: visualizacoesPrev,
      change: visualizacoesChange,
      changeLabel: "vs. 30 dias anteriores",
    } satisfies MockKPI,
    alcance: {
      value: formatNumber(alcanceRaw),
      raw: alcanceRaw,
      previousValue: formatNumber(alcancePrev),
      previousRaw: alcancePrev,
      change: alcanceChange,
      changeLabel: "vs. 30 dias anteriores",
    } satisfies MockKPI,
    ultimaSincronizacao: {
      value: formatDateLabel(),
      raw: Date.now(),
      previousValue: "—",
      previousRaw: 0,
      change: 0,
      changeLabel: "Ultima atualizacao automatica",
    } satisfies MockKPI,
  };

  // Series temporais - quantidade de pontos varia com o periodo selecionado
  const receitaSeries: MockTimeSeriesPoint[] = [];
  const seguidoresSeries: MockTimeSeriesPoint[] = [];
  const engagementSeries: MockTimeSeriesPoint[] = [];
  const currentMonth = new Date().getMonth();

  // Determinar numero de pontos e rotulo de cada ponto conforme o periodo
  const periodDays =
    filters.period === "custom" ? 365 : (filters.period as number);
  let numPoints: number;
  if (periodDays <= 7) numPoints = 7;
  else if (periodDays <= 30) numPoints = 30;
  else if (periodDays <= 90) numPoints = 12; // 12 semanas
  else numPoints = 12; // 12 meses

  for (let i = numPoints - 1; i >= 0; i--) {
    let label: string;
    let date: string;

    if (periodDays <= 7) {
      // Pontos diarios para 7 dias
      const d = new Date();
      d.setDate(d.getDate() - i);
      date = d.toISOString();
      label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } else if (periodDays <= 30) {
      // Pontos diarios para 30 dias (agrupados a cada few dias para legibilidade)
      const d = new Date();
      d.setDate(d.getDate() - i);
      date = d.toISOString();
      label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } else if (periodDays <= 90) {
      // Pontos semanais para 90 dias
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      date = d.toISOString();
      label = `S${numPoints - i}`;
    } else {
      // Pontos mensais para 365 dias
      const monthIdx = (currentMonth - i + 12) % 12;
      label = MONTH_LABELS[monthIdx];
      date = new Date(2026, monthIdx, 1).toISOString();
    }

    // Valores escalados conforme o periodo (periodos menores = valores menores)
    const scaleMultiplier = periodDays <= 7 ? 0.15 : periodDays <= 30 ? 0.35 : periodDays <= 90 ? 0.7 : 1;

    receitaSeries.push({
      date,
      label,
      value: Math.round(randInt(rng, 25000, 92000) * scaleMultiplier),
    });
    seguidoresSeries.push({
      date,
      label,
      value: Math.round(randInt(rng, 22000, 54000) * scaleMultiplier),
    });
    engagementSeries.push({
      date,
      label,
      value: randFloat(rng, 1.8, 8.5),
    });
  }

  // Metricas por unidade de negocio - placeholder para comparativos.
  // Filtra para a unidade selecionada (ou todas).
  const allUnitSlugs = [
    { slug: "BORGO", name: "Borgo del Vino" },
    { slug: "MAPLE_BEAR", name: "Maple Bear" },
    { slug: "AZUL", name: "Grupo Azul" },
    { slug: "COMP-GRAN-RESERVA", name: "Gran Reserva" },
  ];

  const visibleUnitSlugs = filters.unit === "all"
    ? allUnitSlugs
    : allUnitSlugs.filter((u) => u.slug === filters.unit);

  const unitMetrics: MockUnitMetric[] = visibleUnitSlugs.map((u) => ({
    slug: u.slug,
    name: u.name,
    receita: randInt(rng, 32000, 185000),
    seguidores: randInt(rng, 4800, 18000),
    crescimento: randFloat(rng, 1.2, 16.8),
    engagement: randFloat(rng, 2.0, 7.5),
  }));

  // Distribuicao por plataforma - placeholder para pizza/donut.
  // Filtra para a plataforma selecionada (ou todas).
  const allPlatformBase = [
    { platform: "Instagram", base: 32, filterKey: "instagram" },
    { platform: "Facebook", base: 21, filterKey: "facebook" },
    { platform: "YouTube", base: 18, filterKey: "youtube" },
    { platform: "TikTok", base: 12, filterKey: "tiktok" },
    { platform: "Site", base: 12, filterKey: "site" },
    { platform: "Outros", base: 5, filterKey: "outros" },
  ];

  const visiblePlatformBase = filters.platform === "all"
    ? allPlatformBase
    : allPlatformBase.filter((p) => p.filterKey === filters.platform);

  const totalBase = visiblePlatformBase.reduce((sum, p) => sum + p.base, 0);
  const platformDistribution: MockPlatformDistribution[] = visiblePlatformBase.map((p) => ({
    platform: p.platform,
    percentage: totalBase > 0 ? (p.base / totalBase) * 100 : 0,
    value: Math.round((p.base / (totalBase || 1)) * seguidoresTotaisRaw),
  }));

  return {
    kpis,
    receitaSeries,
    seguidoresSeries,
    engagementSeries,
    unitMetrics,
    platformDistribution,
    filters,
  };
}
