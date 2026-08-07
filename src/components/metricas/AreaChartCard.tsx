"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MockTimeSeriesPoint } from "@/lib/mock/dashboard-metrics";
import { ChartContainer, ChartTooltip } from "./ChartContainer";
import {
  CHART_COLORS,
  CHART_GRID_COLOR,
  CHART_TEXT_COLOR,
  CHART_ANIMATION_DURATION,
} from "./chart-theme";

/**
 * Grafico de area reutilizavel para serie temporal de seguidores.
 *
 * Features:
 * - Tooltip customizada com formato de numero compacto
 * - Legenda com nome legivel
 * - Gradiente suave (definido via <defs>) para preenchimento
 * - Animacao de entrada leve (600ms, easeOut)
 * - Estado de loading via ChartSkeleton
 * - Responsivo via ResponsiveContainer
 */

interface AreaChartCardProps {
  data: MockTimeSeriesPoint[];
  isLoading?: boolean;
  height?: number;
  seriesLabel?: string;
  dataKey?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
}

export function AreaChartCard({
  data,
  isLoading = false,
  height = 240,
  seriesLabel = "Seguidores",
  dataKey = "value",
  color = CHART_COLORS.secundar,
  valueFormatter = defaultNumberFormatter,
}: AreaChartCardProps) {
  // ID unico para o gradiente, derivado do dataKey para evitar colisoes
  const gradientId = `areaGradient-${dataKey}`;

  return (
    <ChartContainer isLoading={isLoading} height={height} variant="area">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: -8 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_GRID_COLOR}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_TEXT_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_GRID_COLOR }}
          />
          <YAxis
            tick={{ fill: CHART_TEXT_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => compactNumberFormatter(v)}
            width={56}
          />
          <Tooltip
            content={
              <ChartTooltip
                valueLabel={seriesLabel}
                valueFormatter={(v) => valueFormatter(Number(v))}
              />
            }
          />
          <Legend
            formatter={() => (
              <span className="text-xs text-brand-terciar/70 font-mono">
                {seriesLabel}
              </span>
            )}
            iconType="plainline"
            iconSize={16}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            animationDuration={CHART_ANIMATION_DURATION}
            animationEasing="ease-out"
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function defaultNumberFormatter(value: number): string {
  return value.toLocaleString("pt-BR");
}

function compactNumberFormatter(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(0) + "K";
  return value.toLocaleString("pt-BR");
}
