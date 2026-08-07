"use client";

import {
  LineChart,
  Line,
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
 * Grafico de linhas reutilizavel para serie temporal de receita.
 *
 * Features:
 * - Tooltip customizada com formato de moeda
 * - Legenda com nome legivel
 * - Animacao de entrada leve (600ms, easeOut)
 * - Estado de loading via ChartSkeleton
 * - Responsivo via ResponsiveContainer
 */

interface LineChartCardProps {
  data: MockTimeSeriesPoint[];
  isLoading?: boolean;
  height?: number;
  /** Label exibido na legenda e na tooltip (ex: "Receita") */
  seriesLabel?: string;
  dataKey?: string;
  /** Cor da linha (default: brand-secundar) */
  color?: string;
  /** Funcao para formatar o valor na tooltip e no YAxis */
  valueFormatter?: (value: number) => string;
}

export function LineChartCard({
  data,
  isLoading = false,
  height = 240,
  seriesLabel = "Receita",
  dataKey = "value",
  color = CHART_COLORS.secundar,
  valueFormatter = defaultCurrencyFormatter,
}: LineChartCardProps) {
  return (
    <ChartContainer isLoading={isLoading} height={height} variant="line">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
          <Line
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2
            }
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            animationDuration={CHART_ANIMATION_DURATION}
            animationEasing="ease-out"
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function defaultCurrencyFormatter(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function compactNumberFormatter(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(0) + "K";
  return value.toLocaleString("pt-BR");
}
