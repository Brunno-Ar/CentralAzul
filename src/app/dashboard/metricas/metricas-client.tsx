"use client";

import { useMemo, useState, memo } from "react";
import {
  DollarSign,
  CalendarDays,
  Users,
  TrendingUp,
  Heart,
  Eye,
  Globe,
  LineChart,
  BarChart3,
  AreaChart as AreaIcon,
  GitCompare,
  PieChart,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { SectionCard } from "@/components/metricas/SectionCard";
import { KpiGrid } from "@/components/metricas/KpiGrid";
import { FiltersBar } from "@/components/metricas/FiltersBar";
import { ComparisonUnitSelector } from "@/components/metricas/ComparisonUnitSelector";
import { EmptyState } from "@/components/metricas/EmptyState";
import {
  LazyLineChartCard,
  LazyAreaChartCard,
  LazyBarChartCard,
  LazyComparisonBarChart,
  LazyComparisonRadarChart,
  LazyPlatformDonutChart,
  LazyPlatformStackedBarChart,
} from "@/components/metricas/lazy-charts";
import { useChartHeight } from "@/components/metricas/use-chart-height";
import {
  MetricasFiltersProvider,
  useMetricasFilters,
} from "@/components/metricas/use-metricas-filters";
import {
  generateDashboardMockData,
  type DashboardMockData,
} from "@/lib/mock/dashboard-metrics";

interface MetricasClientProps {
  userRole: string;
  userLevel: number;
  data: DashboardMockData;
}

export default function MetricasClient({
  userRole,
  userLevel,
  data: initialData,
}: MetricasClientProps) {
  return (
    <MetricasFiltersProvider>
      <MetricasClientContent
        userRole={userRole}
        userLevel={userLevel}
        initialData={initialData}
      />
    </MetricasFiltersProvider>
  );
}

function MetricasClientContent({
  userRole,
  userLevel,
  initialData,
}: {
  userRole: string;
  userLevel: number;
  initialData: DashboardMockData;
}) {
  const { filters } = useMetricasFilters();

  // Regenera os dados mock quando os filtros mudam.
  // Em producão, isto seria substituído por fetch a API com cache.
  const data = useMemo(
    () => generateDashboardMockData(filters),
    [filters],
  );

  // Se os filtros ainda sao os padrao, usa os dados iniciais do server
  // para evitar recompute desnecessario.
  const displayData =
    filters.period === initialData.filters.period &&
    filters.unit === initialData.filters.unit &&
    filters.platform === initialData.filters.platform &&
    filters.period !== "custom"
      ? initialData
      : data;

  const k = displayData.kpis;

  // Alturas responsivas para graficos (Bloco 5.7 -性能)
  // Reduz altura em mobile para otimizar espaco vertical
  const timeSeriesHeight = useChartHeight(240);
  const comparisonBarHeight = useChartHeight(280);
  const radarHeight = useChartHeight(320);
  const donutHeight = useChartHeight(280);
  const stackedBarHeight = useChartHeight(200);

  // Estado para a selecao de unidades no comparativo (Bloco 5.5).
  // Inicia com todas as unidades selecionadas.
  // Memoiza os slugs iniciais para evitar recalculo em re-renders.
  const initialSlugs = useMemo(
    () => displayData.unitMetrics.map((u) => u.slug),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // So calcula uma vez na montagem
  );
  const [comparisonSelectedSlugs, setComparisonSelectedSlugs] = useState<string[]>(
    initialSlugs,
  );

  return (
    <PageWrapper title="Metricas">
      {/* Skip link de acessibilidade para leitores de tela */}
      <a
        href="#metricas-conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-secundar focus:text-white focus:text-xs focus:font-semibold"
      >
        Pular para o conteudo principal
      </a>

      <div
        id="metricas-conteudo"
        className="space-y-8 text-brand-terciar"
        role="main"
        aria-label="Dashboard de Metricas e Desempenho"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-terciar/10">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
              Metricas e Desempenho
            </h1>
            <p className="text-xs text-brand-terciar/70 mt-1 leading-normal" aria-live="polite">
              Visao consolidada do desempenho de todas as unidades do Grupo Azul.
              Seu nivel atual e Nivel {userLevel} ({userRole}).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-lg border border-brand-terciar/10 bg-white text-xs font-semibold text-brand-terciar">
            <Clock className="w-3.5 h-3.5 text-brand-secundar" />
            <span className="font-mono">{k.ultimaSincronizacao.value}</span>
          </div>
        </div>

        {/* Filtros Globais - Bloco 5.3 */}
        <FiltersBar />

        {/* KPI Grid - 8 cards com icone, valor, comparacao e indicador */}
        <KpiGrid kpis={k} />

        {/* Resumo de Comparacao - mostra valores do periodo anterior */}
        <SectionCard title="Comparacao com Periodo Anterior" icon={TrendingUp}>
          <div className="space-y-3">
            <ComparisonRow
              icon={DollarSign}
              label="Receita Total"
              current={k.receitaTotal.value}
              previous={k.receitaTotal.previousValue}
              change={k.receitaTotal.change}
              changeLabel={k.receitaTotal.changeLabel}
              iconColor="text-amber-600"
            />
            <ComparisonRow
              icon={CalendarDays}
              label="Receita Mensal"
              current={k.receitaMensal.value}
              previous={k.receitaMensal.previousValue}
              change={k.receitaMensal.change}
              changeLabel={k.receitaMensal.changeLabel}
              iconColor="text-amber-700"
            />
            <ComparisonRow
              icon={Users}
              label="Seguidores Totais"
              current={k.seguidoresTotais.value}
              previous={k.seguidoresTotais.previousValue}
              change={k.seguidoresTotais.change}
              changeLabel={k.seguidoresTotais.changeLabel}
              iconColor="text-brand-secundar"
            />
            <ComparisonRow
              icon={TrendingUp}
              label="Crescimento"
              current={k.crescimento.value}
              previous={k.crescimento.previousValue}
              change={k.crescimento.change}
              changeLabel={k.crescimento.changeLabel}
              iconColor="text-emerald-700"
            />
            <ComparisonRow
              icon={Heart}
              label="Engagement Medio"
              current={k.engagementMedio.value}
              previous={k.engagementMedio.previousValue}
              change={k.engagementMedio.change}
              changeLabel={k.engagementMedio.changeLabel}
              iconColor="text-rose-700"
            />
            <ComparisonRow
              icon={Eye}
              label="Visualizacoes"
              current={k.visualizacoes.value}
              previous={k.visualizacoes.previousValue}
              change={k.visualizacoes.change}
              changeLabel={k.visualizacoes.changeLabel}
              iconColor="text-violet-700"
            />
            <ComparisonRow
              icon={Globe}
              label="Alcance"
              current={k.alcance.value}
              previous={k.alcance.previousValue}
              change={k.alcance.change}
              changeLabel={k.alcance.changeLabel}
              iconColor="text-sky-700"
            />
          </div>
        </SectionCard>

        {/* Grafico de Receita - Bloco 5.4 (lazy loaded) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <SectionCard title="Evolucao de Receita" icon={LineChart}>
            {displayData.receitaSeries.length === 0 ? (
              <EmptyState
                icon={LineChart}
                title="Sem dados de receita"
                description="Nao ha dados de receita para o periodo selecionado."
                height={timeSeriesHeight}
              />
            ) : (
              <LazyLineChartCard data={displayData.receitaSeries} seriesLabel="Receita" height={timeSeriesHeight} />
            )}
          </SectionCard>

          {/* Grafico de Seguidores - Bloco 5.4 (lazy loaded) */}
          <SectionCard title="Crescimento de Seguidores" icon={AreaIcon}>
            {displayData.seguidoresSeries.length === 0 ? (
              <EmptyState
                icon={AreaIcon}
                title="Sem dados de seguidores"
                description="Nao ha dados de seguidores para o periodo selecionado."
                height={timeSeriesHeight}
              />
            ) : (
              <LazyAreaChartCard data={displayData.seguidoresSeries} seriesLabel="Seguidores" height={timeSeriesHeight} />
            )}
          </SectionCard>
        </div>

        {/* Grafico de Engagement - Bloco 5.4 (lazy loaded) */}
        <SectionCard title="Engagement Mensal" icon={BarChart3}>
          {displayData.engagementSeries.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Sem dados de engagement"
              description="Nao ha dados de engagement para o periodo selecionado."
              height={timeSeriesHeight}
            />
          ) : (
            <LazyBarChartCard data={displayData.engagementSeries} seriesLabel="Engagement" height={timeSeriesHeight} />
          )}
        </SectionCard>

        {/* Comparativo entre unidades - Bloco 5.5 (lazy loaded) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <SectionCard title="Comparativo de Barras" icon={BarChart3}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-brand-terciar/70">
                  Compare as metricas entre unidades selecionadas.
                </p>
                {displayData.unitMetrics.length > 1 && (
                  <ComparisonUnitSelector
                    units={displayData.unitMetrics}
                    selectedSlugs={comparisonSelectedSlugs}
                    onChange={setComparisonSelectedSlugs}
                  />
                )}
              </div>
              {displayData.unitMetrics.length <= 1 ? (
                <EmptyState
                  icon={BarChart3}
                  title="Selecione outra unidade"
                  description="O comparativo exige duas ou mais unidades. Ajuste o filtro de unidade para ver todas."
                  height={comparisonBarHeight}
                />
              ) : (
                <LazyComparisonBarChart
                  units={displayData.unitMetrics}
                  selectedSlugs={comparisonSelectedSlugs}
                  height={comparisonBarHeight}
                />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Perfil Comparativo" icon={GitCompare}>
            <div className="space-y-4">
              <p className="text-xs text-brand-terciar/70">
                Visao multidimensional das unidades (valores normalizados 0-100).
              </p>
              {displayData.unitMetrics.length <= 1 ? (
                <EmptyState
                  icon={GitCompare}
                  title="Sem unidades para comparar"
                  description="Ajuste o filtro de unidade para incluir duas ou mais unidades."
                  height={radarHeight}
                />
              ) : (
                <LazyComparisonRadarChart
                  units={displayData.unitMetrics}
                  selectedSlugs={comparisonSelectedSlugs}
                  height={radarHeight}
                />
              )}
            </div>
          </SectionCard>
        </div>

        {/* Distribuicao por plataforma - Bloco 5.6 (lazy loaded) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <SectionCard title="Distribuicao por Plataforma" icon={PieChart}>
            {displayData.platformDistribution.length === 0 ? (
              <EmptyState
                icon={PieChart}
                title="Sem dados de distribuicao"
                description="Nao ha dados de distribuicao por plataforma para os filtros selecionados."
                height={donutHeight}
              />
            ) : (
              <LazyPlatformDonutChart
                data={displayData.platformDistribution}
                defaultVariant="donut"
                height={donutHeight}
              />
            )}
          </SectionCard>

          <SectionCard title="Composicao Empilhada" icon={BarChart3}>
            <div className="space-y-4">
              <p className="text-xs text-brand-terciar/70">
                Proporcao total da distribuicao entre plataformas.
              </p>
              {displayData.platformDistribution.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="Sem dados de composicao"
                  description="Nao ha dados de composicao por plataforma para os filtros selecionados."
                  height={stackedBarHeight}
                />
              ) : (
                <LazyPlatformStackedBarChart
                  data={displayData.platformDistribution}
                  height={stackedBarHeight}
                />
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageWrapper>
  );
}

/**
 * Linha de comparacao entre periodo atual e periodo anterior.
 * Memoizada para evitar re-renders desnecessarios quando apenas
 * outros KPIs mudam.
 */
const ComparisonRow = memo(function ComparisonRow({
  icon: Icon,
  label,
  current,
  previous,
  change,
  changeLabel,
  iconColor,
}: {
  icon: LucideIcon;
  label: string;
  current: string;
  previous: string;
  change: number;
  changeLabel: string;
  iconColor: string;
}) {
  const isPositive = change >= 0;
  const isNeutral = change === 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-brand-terciar/10 bg-brand-principal/20 text-xs gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
        <span className="font-bold text-brand-extra1 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span className="text-brand-extra1 font-semibold">{current}</span>
          <span className="text-brand-terciar/40 mx-1">/</span>
          <span className="text-brand-terciar/50 font-mono">{previous}</span>
        </div>
        <div
          className={`flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
            isNeutral
              ? "text-brand-terciar/50 bg-brand-terciar/5"
              : isPositive
                ? "text-emerald-700 bg-emerald-50"
                : "text-red-700 bg-red-50"
          }`}
        >
          {isPositive && !isNeutral ? "+" : ""}
          {change.toFixed(1)}%
        </div>
      </div>
      <div className="hidden sm:block text-[9px] text-brand-terciar/40 font-mono whitespace-nowrap">
        {changeLabel}
      </div>
    </div>
  );
});

