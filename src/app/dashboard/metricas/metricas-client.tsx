"use client";

import { useMemo, useState } from "react";
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
import { LineChartCard } from "@/components/metricas/LineChartCard";
import { AreaChartCard } from "@/components/metricas/AreaChartCard";
import { BarChartCard } from "@/components/metricas/BarChartCard";
import { ComparisonUnitSelector } from "@/components/metricas/ComparisonUnitSelector";
import { ComparisonBarChart } from "@/components/metricas/ComparisonBarChart";
import { ComparisonRadarChart } from "@/components/metricas/ComparisonRadarChart";
import { PlatformDonutChart } from "@/components/metricas/PlatformDonutChart";
import { PlatformStackedBarChart } from "@/components/metricas/PlatformStackedBarChart";
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

  // Estado para a selecao de unidades no comparativo (Bloco 5.5).
  // Inicia com todas as unidades selecionadas.
  const [comparisonSelectedSlugs, setComparisonSelectedSlugs] = useState<string[]>(
    displayData.unitMetrics.map((u) => u.slug),
  );

  return (
    <PageWrapper title="Metricas">
      <div className="space-y-8 text-brand-terciar">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-terciar/10">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
              Metricas e Desempenho
            </h1>
            <p className="text-xs text-brand-terciar/70 mt-1 leading-normal">
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

        {/* Grafico de Receita - Bloco 5.4 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Evolucao de Receita" icon={LineChart}>
            <LineChartCard data={displayData.receitaSeries} seriesLabel="Receita" />
          </SectionCard>

          {/* Grafico de Seguidores - Bloco 5.4 */}
          <SectionCard title="Crescimento de Seguidores" icon={AreaIcon}>
            <AreaChartCard data={displayData.seguidoresSeries} seriesLabel="Seguidores" />
          </SectionCard>
        </div>

        {/* Grafico de Engagement - Bloco 5.4 */}
        <SectionCard title="Engagement Mensal" icon={BarChart3}>
          <BarChartCard data={displayData.engagementSeries} seriesLabel="Engagement" />
        </SectionCard>

        {/* Comparativo entre unidades - Bloco 5.5 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Comparativo de Barras" icon={BarChart3}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-brand-terciar/70">
                  Compare as metricas entre unidades selecionadas.
                </p>
                <ComparisonUnitSelector
                  units={displayData.unitMetrics}
                  selectedSlugs={comparisonSelectedSlugs}
                  onChange={setComparisonSelectedSlugs}
                />
              </div>
              <ComparisonBarChart
                units={displayData.unitMetrics}
                selectedSlugs={comparisonSelectedSlugs}
              />
            </div>
          </SectionCard>

          <SectionCard title="Perfil Comparativo" icon={GitCompare}>
            <div className="space-y-4">
              <p className="text-xs text-brand-terciar/70">
                Visao multidimensional das unidades (valores normalizados 0-100).
              </p>
              <ComparisonRadarChart
                units={displayData.unitMetrics}
                selectedSlugs={comparisonSelectedSlugs}
                height={280}
              />
            </div>
          </SectionCard>
        </div>

        {/* Distribuicao por plataforma (placeholder para Bloco 5.6) */}
        {/* Distribuicao por plataforma - Bloco 5.6 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Distribuicao por Plataforma" icon={PieChart}>
            <PlatformDonutChart
              data={displayData.platformDistribution}
              defaultVariant="donut"
            />
          </SectionCard>

          <SectionCard title="Composicao Empilhada" icon={BarChart3}>
            <div className="space-y-4">
              <p className="text-xs text-brand-terciar/70">
                Proporcao total da distribuicao entre plataformas.
              </p>
              <PlatformStackedBarChart
                data={displayData.platformDistribution}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </PageWrapper>
  );
}

/**
 * Linha de comparacao entre periodo atual e periodo anterior.
 */
function ComparisonRow({
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
}

