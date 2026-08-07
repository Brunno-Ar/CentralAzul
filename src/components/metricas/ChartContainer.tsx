"use client";

import { Suspense } from "react";
import type { ReactNode } from "react";
import { ChartSkeleton } from "./ChartSkeleton";

/**
 * Container reutilizavel que envolve graficos com:
 * - ResponsiveContainer do recharts
 * - Estado de loading (skeleton) com Suspense
 * - Estilizacao consistente de fundo e bordas
 *
 * Props:
 * - isLoading: exibe skeleton quando true
 * - height: altura do grafico em pixels
 * - variant: variante do skeleton ("line" | "area" | "bar")
 * - children: o grafico recharts ja configurado
 */

interface ChartContainerProps {
  isLoading?: boolean;
  height?: number;
  variant?: "line" | "area" | "bar";
  children: ReactNode;
  className?: string;
}

export function ChartContainer({
  isLoading = false,
  height = 240,
  variant = "line",
  children,
  className,
}: ChartContainerProps) {
  if (isLoading) {
    return <ChartSkeleton height={height} variant={variant} className={className} />;
  }

  return (
    <Suspense fallback={<ChartSkeleton height={height} variant={variant} className={className} />}>
      <div
        className={`w-full overflow-hidden ${className || ""}`}
        style={{ height }}
      >
        {children}
      </div>
    </Suspense>
  );
}

/**
 * Tooltip customizada reutilizavel para todos os graficos.
 * Aplica o padrao visual do sistema (cards brancos, font-mono para valores).
 */
interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string | number;
  }>;
  label?: string | number;
  /** Funcao opcional para formatar o valor exibido */
  valueFormatter?: (value: number | string) => string;
  /** Label exibido acima do valor (ex: "Receita", "Seguidores") */
  valueLabel?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  valueLabel,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  if (!item) return null;

  const rawValue = item.value;
  const formattedValue = valueFormatter
    ? valueFormatter(rawValue ?? 0)
    : (rawValue?.toString() ?? "-");

  return (
    <div className="px-3 py-2 rounded-lg border border-brand-terciar/15 bg-white shadow-lg text-xs space-y-1">
      {label !== undefined && (
        <p className="font-mono uppercase tracking-wider text-brand-terciar/60 text-[10px]">
          {label}
        </p>
      )}
      <div className="flex items-center gap-2">
        {item.color && (
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
        )}
        <span className="text-brand-terciar/70 font-medium">
          {valueLabel ?? item.name ?? "Valor"}
        </span>
        <span className="text-brand-extra1 font-bold font-mono ml-auto">
          {formattedValue}
        </span>
      </div>
    </div>
  );
}
