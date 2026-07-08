"use client";

import { useMemo, memo } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MockUnitMetric } from "@/lib/mock/dashboard-metrics";
import { ChartContainer } from "./ChartContainer";
import {
  CHART_TEXT_COLOR,
  CHART_GRID_COLOR,
  CHART_PALETTE,
  CHART_ANIMATION_DURATION,
} from "./chart-theme";

/**
 * Grafico de radar (spider chart) para comparacao multidimensional
 * entre unidades de negocio.
 *
 * Cada eixo representa uma metrica (Receita, Seguidores, Crescimento, Engagement).
 * Os valores sao normalizados (0-100) para que todas as dimensoes usem a mesma
 * escala, permitindo visualizar o perfil de cada unidade.
 *
 * Features:
 * - Multiple radar layers (uma por unidade selecionada)
 * - Tooltip com valores normalizados e rotulos legiveis
 * - Legenda com nomes das unidades
 * - Animacao leve (600ms easeOut)
 * - Loading state via ChartContainer
 * - Responsivo via ResponsiveContainer
 */

interface ComparisonRadarChartProps {
  units: MockUnitMetric[];
  selectedSlugs: string[];
  isLoading?: boolean;
  height?: number;
}

/** Rotulos das dimensoes exibidos nos eixos do radar */
const METRIC_LABELS: { key: keyof Pick<MockUnitMetric, "receita" | "seguidores" | "crescimento" | "engagement">; label: string }[] = [
  { key: "receita", label: "Receita" },
  { key: "seguidores", label: "Seguidores" },
  { key: "crescimento", label: "Crescimento" },
  { key: "engagement", label: "Engagement" },
];

export const ComparisonRadarChart = memo(function ComparisonRadarChart({
  units,
  selectedSlugs,
  isLoading = false,
  height = 320,
}: ComparisonRadarChartProps) {
  const { chartData, selectedUnits } = useMemo(() => {
    const selected = units.filter((u) => selectedSlugs.includes(u.slug));

    // Normaliza cada metrica para 0-100 baseado nos valores maximos entre as selecionadas
    const maxValues = METRIC_LABELS.reduce(
      (acc, { key }) => {
        acc[key] = Math.max(...selected.map((u) => u[key]), 1);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Cada ponto de dados e uma metrica (eixo do radar)
    // Cada unidade e uma serie (polid) sobreposta
    const data = METRIC_LABELS.map(({ key, label }) => {
      const point: Record<string, number | string> = { metric: label };
      selected.forEach((unit) => {
        const rawValue = unit[key];
        // Normaliza para 0-100 arredondado
        const normalized = Math.round((rawValue / maxValues[key]) * 100);
        point[unit.slug] = normalized;
      });
      return point;
    });

    return { chartData: data, selectedUnits: selected };
  }, [units, selectedSlugs]);

  return (
    <ChartContainer isLoading={isLoading} height={height} variant="line">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke={CHART_GRID_COLOR} />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: CHART_TEXT_COLOR, fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: CHART_TEXT_COLOR, fontSize: 9 }}
            tickCount={5}
            axisLine={false}
          />
          <Tooltip
            content={<RadarTooltip units={selectedUnits} />}
          />
          <Legend
            formatter={(value) => {
              const unit = selectedUnits.find((u) => u.slug === value);
              return (
                <span className="text-xs text-brand-terciar/70 font-mono">
                  {unit?.name ?? value}
                </span>
              );
            }}
            iconType="circle"
            iconSize={10}
          />
          {selectedUnits.map((unit, index) => {
            const color = CHART_PALETTE[index % CHART_PALETTE.length];
            return (
              <Radar
                key={unit.slug}
                name={unit.slug}
                dataKey={unit.slug}
                stroke={color}
                fill={color}
                fillOpacity={0.08}
                strokeWidth={2}
                animationDuration={CHART_ANIMATION_DURATION}
                animationEasing="ease-out"
                isAnimationActive
              />
            );
          })}
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

/**
 * Tooltip customizada para o grafico de radar.
 * Mostra o rotulo da metrica e os valores normalizados de cada unidade.
 */
function RadarTooltip({
  active,
  payload,
  label,
  units,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
    color?: string;
  }>;
  label?: string | number;
  units: MockUnitMetric[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="px-3 py-2 rounded-lg border border-brand-terciar/15 bg-white shadow-lg text-xs space-y-1.5">
      {label !== undefined && (
        <p className="font-mono uppercase tracking-wider text-brand-terciar/60 text-[10px]">
          {label}
        </p>
      )}
      {payload.map((entry, i) => {
        const unit = units.find((u) => u.slug === entry.name);
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color || "#105D8F" }}
            />
            <span className="text-brand-terciar/70 font-medium">
              {unit?.name ?? entry.name}
            </span>
            <span className="text-brand-extra1 font-bold font-mono ml-auto">
              {entry.value ?? 0}
            </span>
          </div>
        );
      })}
    </div>
  );
}
