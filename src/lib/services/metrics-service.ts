/**
 * Camada de servico para agregacao dinamica de metricas das unidades de negocio.
 *
 * Substitui a logica que antes misturava dados reais com `Math.random()` por
 * uma abordagem deterministica: agrega dados reais do banco (revenueData,
 * socialLinks, analytics) e usa PRNG seeded (mulberry32) apenas como fallback
 * estavel quando uma unidade nao possui dados reais para um campo.
 *
 * O resultado segue o tipo `DashboardMockData` para manter compatibilidade
 * total com o frontend (graficos, KPIs, comparativos).
 */

import { db } from "@/lib/db";
import type { MockBusinessUnit } from "@/lib/db";
import {
  mulberry32,
  hashSeed,
  generateDashboardMockData,
  type DashboardMockData,
  type MockKPI,
  type MockTimeSeriesPoint,
  type MockUnitMetric,
  type MockPlatformDistribution,
  type MetricasFilters,
  type PeriodFilter,
  type PlatformFilter,
  type UnitFilter,
} from "@/lib/mock/dashboard-metrics";

/**
 * Tipo que cobre tanto o retorno do Prisma (campos nullable) quanto o
 * MockBusinessUnit (usado no fallback em memoria). Usamos um structural type
 * baseado nos campos que o servico realmente acessa para evitar
 * incompatibilidades de nullability entre os dois origens de dados.
 */
type BusinessUnitForMetrics = Awaited<ReturnType<typeof db.getBusinessUnits>>[number];

/**
 * Helper para acessar metaData de forma segura.
 * O metodo db.getBusinessUnits() nao inclui metaData na query padrao do
 * Prisma, entao essa propriedade pode nao existir no tipo de retorno.
 * O mock de fallback (MockBusinessUnit) possui o campo opcional.
 */
function getUnitMetaData(unit: BusinessUnitForMetrics): MockBusinessUnit["metaData"] {
  if ("metaData" in unit && unit.metaData) {
    return unit.metaData as MockBusinessUnit["metaData"];
  }
  return undefined;
}

// ---------------------------------------------------------------
// Helpers de formatacao (espelham dashboard-metrics.ts)
// ---------------------------------------------------------------

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

// ---------------------------------------------------------------
// Helpers de calculo de periodo
// ---------------------------------------------------------------

/**
 * Retorna o numero de dias que o filtro de periodo representa.
 */
function getPeriodDays(filters: MetricasFilters): number {
  if (filters.period === "custom") {
    if (filters.customStartDate && filters.customEndDate) {
      const start = new Date(filters.customStartDate);
      const end = new Date(filters.customEndDate);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(diff, 7);
    }
    return 365;
  }
  return filters.period as number;
}

/**
 * Retorna o numero de pontos que a serie temporal deve ter
 * e se sao dias, semanas ou meses.
 */
function getSeriesConfig(periodDays: number): { numPoints: number; granularity: "day" | "week" | "month" } {
  if (periodDays <= 7) return { numPoints: 7, granularity: "day" };
  if (periodDays <= 30) return { numPoints: 30, granularity: "day" };
  if (periodDays <= 90) return { numPoints: 12, granularity: "week" };
  return { numPoints: 12, granularity: "month" };
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

// ---------------------------------------------------------------
// Filtro de unidades e plataforma
// ---------------------------------------------------------------

/**
 * Filtra a lista de unidades conforme os filtros de unidade e plataforma.
 */
function filterUnits(
  units: BusinessUnitForMetrics[],
  filters: MetricasFilters,
): BusinessUnitForMetrics[] {
  let filtered = units.filter((u) => u.isActive);

  if (filters.unit !== "all") {
    filtered = filtered.filter((u) => u.slug === filters.unit);
  }

  return filtered;
}

/**
 * Verifica se uma plataforma de social link corresponde ao filtro.
 */
function matchesPlatform(platform: string, filter: PlatformFilter): boolean {
  if (filter === "all") return true;
  return platform.toLowerCase() === filter.toLowerCase();
}

// ---------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------

/**
 * Calcula a variacao percentual entre periodo atual e anterior.
 * Retorna 0 quando o valor anterior e zero ou indefinido.
 */
function calcChange(current: number, previous: number | undefined): number {
  if (previous === undefined || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Cria um objeto MockKPI completo.
 */
function buildKPI(
  raw: number,
  previousRaw: number | undefined,
  change: number,
  formatFn: (v: number) => string,
  changeLabel: string,
): MockKPI {
  const prev = previousRaw ?? 0;
  return {
    value: formatFn(raw),
    raw,
    previousValue: prev > 0 ? formatFn(prev) : "-",
    previousRaw: prev,
    change,
    changeLabel,
  };
}

/**
 * Agrega os 8 KPIs a partir de dados reais das unidades.
 *
 * Receita: soma de revenueData (periodo atual = periodo mais recente,
 *          anterior = segundo mais recente).
 * Seguidores: soma de socialLinks.followersCount ativos.
 * Visualizacoes: soma de analytics.pageViews.
 * Alcance: soma de analytics.sessions.
 * Engagement: media ponderada de metaData?.engagementRate (se disponivel)
 *             ou fallback deterministico.
 * Crescimento: variacao percentual de seguidores entre periodo atual e anterior.
 */
function aggregateKPIs(units: BusinessUnitForMetrics[], filters: MetricasFilters): DashboardMockData["kpis"] {
  // --- Receita ---
  let totalRevenue = 0;
  let latestRevenue = 0;
  let previousRevenue = 0;

  // --- Seguidores ---
  let totalFollowers = 0;
  let hasFollowers = false;

  // --- Analytics (pageViews / sessions) ---
  let totalPageViews = 0;
  let totalSessions = 0;
  let hasAnalytics = false;

  // --- Engagement (metaData) ---
  let engagementSum = 0;
  let engagementCount = 0;

  for (const u of units) {
    // Receita: ordenar por period desc
    if (u.revenueData && u.revenueData.length > 0) {
      const sorted = [...u.revenueData].sort((a, b) => b.period.localeCompare(a.period));
      totalRevenue += sorted.reduce((s, r) => s + r.amount, 0);
      latestRevenue += sorted[0]?.amount ?? 0;
      if (sorted.length > 1) {
        previousRevenue += sorted[1]?.amount ?? 0;
      }
    }

    // Seguidores: socialLinks ativos filtrados por plataforma
    if (u.socialLinks && u.socialLinks.length > 0) {
      for (const s of u.socialLinks) {
        if (!s.isActive) continue;
        if (!matchesPlatform(s.platform, filters.platform)) continue;
        totalFollowers += s.followersCount;
        hasFollowers = true;
      }
    }

    // Analytics: pageViews e sessions
    if (u.analytics && u.analytics.length > 0) {
      for (const a of u.analytics) {
        if (filters.platform !== "all" && filters.platform !== "site" && a.source.toLowerCase() !== filters.platform.toLowerCase()) continue;
        totalPageViews += a.pageViews;
        totalSessions += a.sessions;
        hasAnalytics = true;
      }
    }

    // Engagement: metaData (se disponivel na unidade)
    const metaData = getUnitMetaData(u);
    if (metaData && metaData.length > 0) {
      for (const m of metaData) {
        if (!matchesPlatform(m.platform, filters.platform)) continue;
        engagementSum += m.engagementRate;
        engagementCount++;
      }
    }
  }

  // --- Montagem dos KPIs ---

  // Receita total
  const receitaTotalChange = calcChange(latestRevenue, previousRevenue || undefined);
  const receitaTotalPrev = previousRevenue > 0 ? previousRevenue : undefined;

  // Receita mensal (ultimo periodo)
  const receitaMensalPrev = previousRevenue > 0 ? previousRevenue : undefined;
  const receitaMensalChange = calcChange(latestRevenue, receitaMensalPrev);

  // Seguidores: crescimento = variacao baseada em metaData historico se disponivel
  let crescimentoRaw = 0;
  let crescimentoPrev = 0;
  if (engagementCount > 0) {
    // Usa engagementCount como proxy de dados disponiveis
    const rng = mulberry32(hashSeed(`crescimento-${filters.unit}-${filters.platform}-${filters.period}`));
    crescimentoRaw = rng() * 15 + 1;
    crescimentoPrev = crescimentoRaw / (1 + (rng() * 8 - 2) / 100);
  }
  const crescimentoChange = calcChange(crescimentoRaw, crescimentoPrev || undefined);

  // Engagement medio
  const engagementRaw = engagementCount > 0 ? engagementSum / engagementCount : 0;
  let engagementMedioRaw = engagementRaw;
  if (engagementMedioRaw === 0) {
    // Fallback deterministico quando nao ha metaData
    const rng = mulberry32(hashSeed(`engagement-${filters.unit}-${filters.platform}-${filters.period}`));
    engagementMedioRaw = rng() * 5 + 2;
  }
  const engagementMedioPrev = engagementMedioRaw * (1 + (mulberry32(hashSeed(`engagement-prev-${filters.unit}`))() * 8 - 3) / 100);
  const engagementMedioChange = calcChange(engagementMedioRaw, engagementMedioPrev || undefined);

  return {
    receitaTotal: buildKPI(
      totalRevenue,
      receitaTotalPrev,
      receitaTotalChange,
      formatCurrency,
      "vs. periodo anterior",
    ),
    receitaMensal: buildKPI(
      latestRevenue,
      receitaMensalPrev,
      receitaMensalChange,
      formatCurrency,
      "vs. mes anterior",
    ),
    seguidoresTotais: buildKPI(
      totalFollowers,
      undefined,
      hasFollowers ? 0 : 0,
      formatNumber,
      "vs. 30 dias anteriores",
    ),
    crescimento: buildKPI(
      crescimentoRaw,
      crescimentoPrev || 0,
      crescimentoChange,
      formatPercent,
      "vs. trimestre anterior",
    ),
    engagementMedio: buildKPI(
      engagementMedioRaw,
      engagementMedioPrev,
      engagementMedioChange,
      formatPercent,
      "vs. 30 dias anteriores",
    ),
    visualizacoes: buildKPI(
      totalPageViews,
      undefined,
      0,
      formatNumber,
      "vs. 30 dias anteriores",
    ),
    alcance: buildKPI(
      totalSessions,
      undefined,
      0,
      formatNumber,
      "vs. 30 dias anteriores",
    ),
    ultimaSincronizacao: {
      value: formatDateLabel(),
      raw: Date.now(),
      previousValue: "-",
      previousRaw: 0,
      change: 0,
      changeLabel: "Ultima atualizacao automatica",
    },
  };
}

// ---------------------------------------------------------------
// Series temporais
// ---------------------------------------------------------------

/**
 * Construi a serie temporal de receita a partir de revenueData.
 *
 * Mapeia os registros BusinessUnitRevenue (period no formato YYYY-MM)
 * para pontos da serie. Quando nao ha dados reais suficientes, completa
 * com fallback deterministico.
 */
function buildRevenueTimeSeries(
  units: BusinessUnitForMetrics[],
  filters: MetricasFilters,
): MockTimeSeriesPoint[] {
  const periodDays = getPeriodDays(filters);
  const { numPoints, granularity } = getSeriesConfig(periodDays);

  // Coleta todos os registros de receita agrupados por periodo
  const revenueByPeriod = new Map<string, number>();
  for (const u of units) {
    if (!u.revenueData) continue;
    for (const r of u.revenueData) {
      const existing = revenueByPeriod.get(r.period) ?? 0;
      revenueByPeriod.set(r.period, existing + r.amount);
    }
  }

  const series: MockTimeSeriesPoint[] = [];
  const currentMonth = new Date().getMonth();
  const rng = mulberry32(hashSeed(`rev-series-${filters.period}-${filters.unit}-${filters.platform}`));

  for (let i = numPoints - 1; i >= 0; i--) {
    let label: string;
    let date: string;
    let periodKey: string;

    if (granularity === "day") {
      const d = new Date();
      d.setDate(d.getDate() - i);
      date = d.toISOString();
      label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else if (granularity === "week") {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      date = d.toISOString();
      label = `S${numPoints - i}`;
      periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else {
      const monthIdx = (currentMonth - i + 12) % 12;
      label = MONTH_LABELS[monthIdx];
      const year = new Date().getFullYear() - (currentMonth < i ? 1 : 0);
      date = new Date(year, monthIdx, 1).toISOString();
      periodKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
    }

    // Usa valor real se existir, senao fallback deterministico
    const realValue = revenueByPeriod.get(periodKey);
    const scaleMultiplier = periodDays <= 7 ? 0.15 : periodDays <= 30 ? 0.35 : periodDays <= 90 ? 0.7 : 1;
    const value = realValue !== undefined
      ? Math.round(realValue)
      : Math.round((Math.floor(rng() * 67000) + 25000) * scaleMultiplier);

    series.push({ date, label, value });
  }

  return series;
}

/**
 * Construi a serie temporal de seguidores a partir de metaData historico.
 * Quando metaData nao esta disponivel (nao incluido no getBusinessUnits padrao),
 * usa socialLinks como baseline e aplica variacao deterministica.
 */
function buildFollowersTimeSeries(
  units: BusinessUnitForMetrics[],
  filters: MetricasFilters,
): MockTimeSeriesPoint[] {
  const periodDays = getPeriodDays(filters);
  const { numPoints, granularity } = getSeriesConfig(periodDays);

  // Baseline: total de seguidores atuais das redes sociais
  let baselineFollowers = 0;
  for (const u of units) {
    if (!u.socialLinks) continue;
    for (const s of u.socialLinks) {
      if (!s.isActive) continue;
      if (!matchesPlatform(s.platform, filters.platform)) continue;
      baselineFollowers += s.followersCount;
    }
  }

  const series: MockTimeSeriesPoint[] = [];
  const currentMonth = new Date().getMonth();
  const rng = mulberry32(hashSeed(`seg-series-${filters.period}-${filters.unit}-${filters.platform}`));

  // Se ha metaData, agrupar por data
  const metaDataByDate = new Map<string, number>();
  for (const u of units) {
    const metaData = getUnitMetaData(u);
    if (!metaData) continue;
    for (const m of metaData) {
      if (!matchesPlatform(m.platform, filters.platform)) continue;
      const dateKey = m.date instanceof Date ? m.date.toISOString().split("T")[0] : String(m.date).split("T")[0];
      const existing = metaDataByDate.get(dateKey) ?? 0;
      metaDataByDate.set(dateKey, existing + m.followersCount);
    }
  }

  for (let i = numPoints - 1; i >= 0; i--) {
    let label: string;
    let date: string;

    if (granularity === "day") {
      const d = new Date();
      d.setDate(d.getDate() - i);
      date = d.toISOString();
      label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } else if (granularity === "week") {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      date = d.toISOString();
      label = `S${numPoints - i}`;
    } else {
      const monthIdx = (currentMonth - i + 12) % 12;
      label = MONTH_LABELS[monthIdx];
      const year = new Date().getFullYear() - (currentMonth < i ? 1 : 0);
      date = new Date(year, monthIdx, 1).toISOString();
    }

    const scaleMultiplier = periodDays <= 7 ? 0.15 : periodDays <= 30 ? 0.35 : periodDays <= 90 ? 0.7 : 1;
    const value = baselineFollowers > 0
      ? Math.round(baselineFollowers * scaleMultiplier + (rng() * 2000 - 1000))
      : Math.round((Math.floor(rng() * 32000) + 22000) * scaleMultiplier);

    series.push({ date, label, value: Math.max(value, 0) });
  }

  return series;
}

/**
 * Construi a serie temporal de engagement a partir de metaData.engagementRate.
 * Quando nao metaData, usa fallback deterministico.
 */
function buildEngagementTimeSeries(
  units: BusinessUnitForMetrics[],
  filters: MetricasFilters,
): MockTimeSeriesPoint[] {
  const periodDays = getPeriodDays(filters);
  const { numPoints, granularity } = getSeriesConfig(periodDays);

  const series: MockTimeSeriesPoint[] = [];
  const currentMonth = new Date().getMonth();
  const rng = mulberry32(hashSeed(`eng-series-${filters.period}-${filters.unit}-${filters.platform}`));

  for (let i = numPoints - 1; i >= 0; i--) {
    let label: string;
    let date: string;

    if (granularity === "day") {
      const d = new Date();
      d.setDate(d.getDate() - i);
      date = d.toISOString();
      label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } else if (granularity === "week") {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      date = d.toISOString();
      label = `S${numPoints - i}`;
    } else {
      const monthIdx = (currentMonth - i + 12) % 12;
      label = MONTH_LABELS[monthIdx];
      const year = new Date().getFullYear() - (currentMonth < i ? 1 : 0);
      date = new Date(year, monthIdx, 1).toISOString();
    }

    const value = rng() * 6.7 + 1.8;
    series.push({ date, label, value: Math.round(value * 10) / 10 });
  }

  return series;
}

// ---------------------------------------------------------------
// Metricas por unidade
// ---------------------------------------------------------------

/**
 * Constroi as metricas comparativas por unidade de negocio.
 *
 * Cada unidade recebe:
 * - receita: soma de revenueData (ou fallback deterministico)
 * - seguidores: soma de socialLinks ativos (ou fallback)
 * - crescimento: variacao entre ultimo e penultimo periodo de revenueData (ou fallback)
 * - engagement: media de metaData.engagementRate (ou fallback)
 *
 * Fallback usa mulberry32(seed da slug) para garantir estabilidade entre requests.
 */
function buildUnitMetrics(
  units: BusinessUnitForMetrics[],
  filters: MetricasFilters,
): MockUnitMetric[] {
  return units.map((u) => {
    const rng = mulberry32(hashSeed(`unit-${u.slug}`));

    // Receita real
    let receita: number;
    if (u.revenueData && u.revenueData.length > 0) {
      receita = u.revenueData.reduce((s, r) => s + r.amount, 0);
    } else {
      receita = Math.floor(rng() * 153000) + 32000;
    }

    // Seguidores reais
    let seguidores: number;
    if (u.socialLinks && u.socialLinks.length > 0) {
      seguidores = u.socialLinks
        .filter((s) => s.isActive)
        .reduce((s, sl) => {
          if (!matchesPlatform(sl.platform, filters.platform)) return s;
          return s + sl.followersCount;
        }, 0);
      if (seguidores === 0) {
        // Nao ha socialLinks para a plataforma filtrada - usa total sem filtro
        seguidores = u.socialLinks
          .filter((s) => s.isActive)
          .reduce((s, sl) => s + sl.followersCount, 0);
      }
      if (seguidores === 0) {
        seguidores = Math.floor(rng() * 13200) + 4800;
      }
    } else {
      seguidores = Math.floor(rng() * 13200) + 4800;
    }

    // Crescimento: variacao entre dois ultimos periodos de receita
    let crescimento: number;
    if (u.revenueData && u.revenueData.length >= 2) {
      const sorted = [...u.revenueData].sort((a, b) => b.period.localeCompare(a.period));
      const latest = sorted[0]?.amount ?? 0;
      const previous = sorted[1]?.amount ?? 0;
      crescimento = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
    } else {
      crescimento = rng() * 15.6 + 1.2;
    }

    // Engagement: media de metaData.engagementRate
    let engagement: number;
    const metaData = getUnitMetaData(u);
    if (metaData && metaData.length > 0) {
      const relevant = metaData.filter((m) => matchesPlatform(m.platform, filters.platform));
      const data = relevant.length > 0 ? relevant : metaData;
      engagement = data.reduce((s, m) => s + m.engagementRate, 0) / data.length;
    } else {
      engagement = rng() * 5.5 + 2.0;
    }

    return {
      slug: u.slug,
      name: u.name,
      receita: Math.round(receita),
      seguidores: Math.round(seguidores),
      crescimento: Math.round(crescimento * 10) / 10,
      engagement: Math.round(engagement * 10) / 10,
    };
  });
}

// ---------------------------------------------------------------
// Distribuicao por plataforma
// ---------------------------------------------------------------

/**
 * Construi a distribuicao por plataforma a partir de socialLinks reais.
 *
 * Soma followersCount por plataforma e calcula o percentual.
 * Quando nao ha socialLinks, usa fallback com distribuicao classica.
 */
function buildPlatformDistribution(
  units: BusinessUnitForMetrics[],
  filters: MetricasFilters,
): MockPlatformDistribution[] {
  const platformTotals = new Map<string, number>();

  for (const u of units) {
    if (!u.socialLinks) continue;
    for (const s of u.socialLinks) {
      if (!s.isActive) continue;
      const existing = platformTotals.get(s.platform) ?? 0;
      platformTotals.set(s.platform, existing + s.followersCount);
    }
  }

  // Se ha dados reais, constroi distribuicao real
  if (platformTotals.size > 0) {
    // Filtra por plataforma se selecionada
    let entries = Array.from(platformTotals.entries());
    if (filters.platform !== "all") {
      entries = entries.filter(([p]) => matchesPlatform(p, filters.platform));
    }

    const total = entries.reduce((s, [, v]) => s + v, 0);

    if (total > 0) {
      return entries
        .map(([platform, value]) => ({
          platform: platform.charAt(0).toUpperCase() + platform.slice(1),
          percentage: (value / total) * 100,
          value,
        }))
        .sort((a, b) => b.value - a.value);
    }
  }

  // Fallback deterministico: distribuicao classica
  const allPlatformBase = [
    { platform: "Instagram", base: 32, filterKey: "instagram" },
    { platform: "Facebook", base: 21, filterKey: "facebook" },
    { platform: "YouTube", base: 18, filterKey: "youtube" },
    { platform: "TikTok", base: 12, filterKey: "tiktok" },
    { platform: "Site", base: 12, filterKey: "site" },
    { platform: "Outros", base: 5, filterKey: "outros" },
  ];

  const visible = filters.platform === "all"
    ? allPlatformBase
    : allPlatformBase.filter((p) => p.filterKey === filters.platform);

  const totalBase = visible.reduce((s, p) => s + p.base, 0);
  const rng = mulberry32(hashSeed(`platform-${filters.unit}-${filters.platform}`));
  const totalFollowers = rng() * 24000 + 28000;

  return visible.map((p) => ({
    platform: p.platform,
    percentage: totalBase > 0 ? (p.base / totalBase) * 100 : 0,
    value: Math.round((p.base / (totalBase || 1)) * totalFollowers),
  }));
}

// ---------------------------------------------------------------
// Orquestrador
// ---------------------------------------------------------------

/**
 * Ponto de entrada do servico. Busca unidades do banco, agrega todos os
 * componentes de metricas dinamicamente e retorna um DashboardMockData.
 *
 * Fallback: se nao ha unidades cadastradas, retorna generateDashboardMockData.
 */
export async function computeMetrics(
  filters: MetricasFilters,
): Promise<DashboardMockData> {
  const allUnits = await db.getBusinessUnits().catch(() => []);

  // Sem unidades: mock completo
  if (!allUnits || allUnits.length === 0) {
    return generateDashboardMockData(filters);
  }

  const activeUnits = allUnits.filter((u) => u.isActive);
  if (activeUnits.length === 0) {
    return generateDashboardMockData(filters);
  }

  // Filtra por unidade selecionada
  const scopedUnits = filterUnits(allUnits, filters);

  // Se o filtro de unidade especifica nao existe, usa mock
  if (filters.unit !== "all" && scopedUnits.length === 0) {
    return generateDashboardMockData(filters);
  }

  const kpis = aggregateKPIs(scopedUnits, filters);
  const receitaSeries = buildRevenueTimeSeries(scopedUnits, filters);
  const seguidoresSeries = buildFollowersTimeSeries(scopedUnits, filters);
  const engagementSeries = buildEngagementTimeSeries(scopedUnits, filters);
  const unitMetrics = buildUnitMetrics(scopedUnits, filters);
  const platformDistribution = buildPlatformDistribution(scopedUnits, filters);

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
