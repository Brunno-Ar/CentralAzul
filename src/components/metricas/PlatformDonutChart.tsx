"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MockPlatformDistribution } from "@/lib/mock/dashboard-metrics";
import { ChartContainer } from "./ChartContainer";
import {
  CHART_PALETTE,
  CHART_ANIMATION_DURATION,
} from "./chart-theme";

/**
 * Grafico de pizza e donut para distribuicao por plataforma.
 *
 * Permite alternar entre visualizacao pizza (full pie) e donut (pie com centro vazio).
 * Cada plataforma recebe cor distinta da paleta da marca.
 *
 * Features:
 * - Toggle entre pizza e donut
 * - Tooltip customizada com percentual e valor absoluto
 * - Legenda com nomes das plataformas
 * - Animacao de entrada leve (600ms easeOut)
 * - Detalhes das fatias com hover
 * - Estado de loading via ChartContainer
 * - Responsivo via ResponsiveContainer
 * - Centro do donut exibe total agregado
 */

type ChartVariant = "pie" | "donut";

interface PlatformDonutChartProps {
  data: MockPlatformDistribution[];
  isLoading?: boolean;
  height?: number;
  /** Variante inicial: "pie" | "donut" (default: "donut") */
  defaultVariant?: ChartVariant;
}

export function PlatformDonutChart({
  data,
  isLoading = false,
  height = 280,
  defaultVariant = "donut",
}: PlatformDonutChartProps) {
  const [variant, setVariant] = useState<ChartVariant>(defaultVariant);

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const isDonut = variant === "donut";
  const innerRadius = isDonut ? "55%" : "0%";
  const outerRadius = "78%";

  return (
    <div className="space-y-4">
      {/* Toggle entre pizza e donut */}
      <div className="flex gap-1.5" role="group" aria-label="Tipo de visualizacao">
        {(["donut", "pie"] as ChartVariant[]).map((v) => {
          const isActive = v === variant;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={isActive}
              onClick={() => setVariant(v)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors duration-200 easeInOut ${
                isActive
                  ? "bg-brand-secundar text-white"
                  : "bg-brand-principal/40 text-brand-terciar/60 hover:bg-brand-principal/60"
              }`}
            >
              {v === "donut" ? "Donut" : "Pizza"}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <ChartContainer isLoading={isLoading} height={height} variant="line">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="percentage"
                nameKey="platform"
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={isDonut ? 2 : 0.5}
                animationDuration={CHART_ANIMATION_DURATION}
                animationEasing="ease-out"
                isAnimationActive
                stroke="#FFFFFF"
                strokeWidth={1.5}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.platform}`}
                    fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<PlatformTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-brand-terciar/70 font-mono">
                    {value}
                  </span>
                )}
                iconType="circle"
                iconSize={10}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Total no centro do donut */}
        {isDonut && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/50">
              Total
            </span>
            <span className="text-lg font-bold text-brand-extra1 font-mono">
              {compactNumber(totalValue)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tooltip customizada para o grafico de distribuicao por plataforma.
 * Mostra nome da plataforma, percentual e valor absoluto.
 */
function PlatformTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
    color?: string;
    payload?: MockPlatformDistribution;
  }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  if (!entry || !entry.payload) return null;

  const { platform, percentage, value } = entry.payload;

  return (
    <div className="px-3 py-2 rounded-lg border border-brand-terciar/15 bg-white shadow-lg text-xs space-y-1">
      <p className="font-mono uppercase tracking-wider text-brand-terciar/60 text-[10px]">
        {platform}
      </p>
      <div className="flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color ?? CHART_PALETTE[0] }} />
        <span className="text-brand-extra1 font-bold font-mono">
          {percentage.toFixed(1)}%
        </span>
        <span className="text-brand-terciar/50 font-mono text-[10px]">
          ({compactNumber(value)})
        </span>
      </div>
    </div>
  );
}

function compactNumber(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(1) + "K";
  return value.toLocaleString("pt-BR");
}
