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
import type { MockPlatformDistribution } from "@/lib/mock/dashboard-metrics";
import { ChartContainer } from "./ChartContainer";
import {
  CHART_GRID_COLOR,
  CHART_TEXT_COLOR,
  CHART_PALETTE,
  CHART_ANIMATION_DURATION,
} from "./chart-theme";

/**
 * Grafico de barras empilhadas para distribuicao por plataforma.
 *
 * Apresenta uma barra unica empilhada (100%) que mostra a composicao
 * total da distribuicao entre as plataformas.
 *
 * Features:
 * - Tooltip customizada com todas as plataformas e seus percentuais
 * - Legenda com nomes das plataformas
 * - Animacao de entrada leve (600ms easeOut)
 * - Barras com cantos arredondados nas extremidades
 * - Estado de loading via ChartContainer
 * - Responsivo via ResponsiveContainer
 */

interface PlatformStackedBarChartProps {
  data: MockPlatformDistribution[];
  isLoading?: boolean;
  height?: number;
}

export function PlatformStackedBarChart({
  data,
  isLoading = false,
  height = 200,
}: PlatformStackedBarChartProps) {
  // Transforma os dados: um unico ponto com as plataformas como chaves distintas
  const chartData = [
    data.reduce(
      (acc, item) => {
        acc[item.platform] = item.percentage;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ];

  return (
    <ChartContainer isLoading={isLoading} height={height} variant="bar">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 12, bottom: 0, left: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_GRID_COLOR}
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: CHART_TEXT_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis type="category" hide />
          <Tooltip
            cursor={{ fill: CHART_GRID_COLOR }}
            content={<StackedBarTooltip data={data} />}
          />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-brand-terciar/70 font-mono">
                {value}
              </span>
            )}
            iconType="square"
            iconSize={12}
          />
          {data.map((platform, index) => (
            <Bar
              key={platform.platform}
              dataKey={platform.platform}
              stackId="distribution"
              fill={CHART_PALETTE[index % CHART_PALETTE.length]}
              radius={
                index === 0
                  ? [6, 0, 0, 6]
                  : index === data.length - 1
                    ? [0, 6, 6, 0]
                    : [0, 0, 0, 0]
              }
              animationDuration={CHART_ANIMATION_DURATION}
              animationEasing="ease-out"
              isAnimationActive
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

/**
 * Tooltip customizada para o grafico de barras empilhadas.
 * Mostra todas as plataformas com seus respectivos percentuais e valores.
 */
function StackedBarTooltip({
  active,
  data: platformData,
}: {
  active?: boolean;
  data: MockPlatformDistribution[];
}) {
  if (!active) return null;

  return (
    <div className="px-3 py-2.5 rounded-lg border border-brand-terciar/15 bg-white shadow-lg text-xs space-y-1.5">
      <p className="font-mono uppercase tracking-wider text-brand-terciar/60 text-[10px]">
        Distribuicao por Plataforma
      </p>
      {platformData.map((item, i) => (
        <div key={item.platform} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}
          />
          <span className="text-brand-terciar/70 font-medium">
            {item.platform}
          </span>
          <span className="text-brand-extra1 font-bold font-mono ml-auto">
            {item.percentage.toFixed(1)}%
          </span>
          <span className="text-brand-terciar/40 font-mono text-[10px]">
            ({compactNumber(item.value)})
          </span>
        </div>
      ))}
    </div>
  );
}

function compactNumber(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(1) + "K";
  return value.toLocaleString("pt-BR");
}
