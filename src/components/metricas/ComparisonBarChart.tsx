"use client";

import { useState, useMemo, memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { MockUnitMetric } from "@/lib/mock/dashboard-metrics";
import { ChartContainer, ChartTooltip } from "./ChartContainer";
import {
  CHART_GRID_COLOR,
  CHART_TEXT_COLOR,
  CHART_PALETTE,
  CHART_ANIMATION_DURATION,
} from "./chart-theme";

/**
 * Grafico de barras comparativo entre unidades de negocio.
 *
 * Permite alternar entre metricas: Receita, Seguidores, Crescimento, Engagement.
 * Cada unidade recebe uma barra com cor distinta da paleta da marca.
 *
 * Features:
 * - Seletor de metrica (tabs)
 * - Tooltip customizada com formato contextual
 * - Legenda com nomes das unidades
 * - Animacao leve (600ms easeOut)
 * - Barras com cantos arredondados
 * - Loading state via ChartContainer
 * - Responsivo via ResponsiveContainer
 */

type MetricKey = "receita" | "seguidores" | "crescimento" | "engagement";

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; formatter: (v: number) => string; compact: (v: number) => string }
> = {
  receita: {
    label: "Receita",
    formatter: (v) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v),
    compact: (v) => (v >= 1000 ? (v / 1000).toFixed(0) + "K" : v.toString()),
  },
  seguidores: {
    label: "Seguidores",
    formatter: (v) => v.toLocaleString("pt-BR"),
    compact: (v) => (v >= 1000 ? (v / 1000).toFixed(0) + "K" : v.toString()),
  },
  crescimento: {
    label: "Crescimento",
    formatter: (v) => v.toFixed(1) + "%",
    compact: (v) => v.toFixed(0) + "%",
  },
  engagement: {
    label: "Engagement",
    formatter: (v) => v.toFixed(1) + "%",
    compact: (v) => v.toFixed(0) + "%",
  },
};

const METRIC_KEYS: MetricKey[] = ["receita", "seguidores", "crescimento", "engagement"];

interface ComparisonBarChartProps {
  units: MockUnitMetric[];
  selectedSlugs: string[];
  isLoading?: boolean;
  height?: number;
}

export const ComparisonBarChart = memo(function ComparisonBarChart({
  units,
  selectedSlugs,
  isLoading = false,
  height = 280,
}: ComparisonBarChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("receita");

  // Filtra as unidades selecionadas
  const chartData = useMemo(() => {
    return units
      .filter((u) => selectedSlugs.includes(u.slug))
      .map((u) => ({
        name: u.name,
        slug: u.slug,
        [activeMetric]: u[activeMetric],
      }));
  }, [units, selectedSlugs, activeMetric]);

  const config = METRIC_CONFIG[activeMetric];

  return (
    <div className="space-y-4">
      {/* Tabs de selecao de metrica */}
      <div className="flex flex-wrap gap-1.5">
        {METRIC_KEYS.map((key) => {
          const isActive = key === activeMetric;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMetric(key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors duration-200 easeInOut ${
                isActive
                  ? "bg-brand-secundar text-white"
                  : "bg-brand-principal/40 text-brand-terciar/60 hover:bg-brand-principal/60"
              }`}
            >
              {METRIC_CONFIG[key].label}
            </button>
          );
        })}
      </div>

      {/* Grafico */}
      <ChartContainer isLoading={isLoading} height={height} variant="bar">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: CHART_TEXT_COLOR, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: CHART_GRID_COLOR }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fill: CHART_TEXT_COLOR, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => config.compact(v)}
              width={56}
            />
            <Tooltip
              cursor={{ fill: CHART_GRID_COLOR }}
              content={
                <ChartTooltip
                  valueLabel={config.label}
                  valueFormatter={(v) => config.formatter(Number(v))}
                />
              }
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-brand-terciar/70 font-mono">{value}</span>
              )}
              iconType="square"
              iconSize={12}
            />
            <Bar
              dataKey={activeMetric}
              radius={[6, 6, 0, 0]}
              animationDuration={CHART_ANIMATION_DURATION}
              animationEasing="ease-out"
              isAnimationActive
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
});
