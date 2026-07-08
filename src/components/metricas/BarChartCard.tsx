"use client";

import {
  BarChart,
  Bar,
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
 * Grafico de barras reutilizavel para serie temporal de engagement.
 *
 * Features:
 * - Tooltip customizada com formato de percentual
 * - Legenda com nome legivel
 * - Barras com cantos arredondados suaves
 * - Animacao de entrada leve (600ms, easeOut)
 * - Estado de loading via ChartSkeleton
 * - Responsivo via ResponsiveContainer
 */

interface BarChartCardProps {
  data: MockTimeSeriesPoint[];
  isLoading?: boolean;
  height?: number;
  seriesLabel?: string;
  dataKey?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
  /** Raio dos cantos das barras (default 6) */
  barRadius?: number;
}

export function BarChartCard({
  data,
  isLoading = false,
  height = 240,
  seriesLabel = "Engagement",
  dataKey = "value",
  color = CHART_COLORS.extra3,
  valueFormatter = defaultPercentFormatter,
  barRadius = 6,
}: BarChartCardProps) {
  return (
    <ChartContainer isLoading={isLoading} height={height} variant="bar">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: -8 }}
        >
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
            tickFormatter={(v: number) => valueFormatter(v)}
            width={48}
          />
          <Tooltip
            cursor={{ fill: CHART_GRID_COLOR }}
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
            iconType="square"
            iconSize={12}
          />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[barRadius, barRadius, 0, 0]}
            animationDuration={CHART_ANIMATION_DURATION}
            animationEasing="ease-out"
            isAnimationActive
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function defaultPercentFormatter(value: number): string {
  return value.toFixed(1) + "%";
}
