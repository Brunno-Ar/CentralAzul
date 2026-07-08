"use client";

/**
 * Skeleton visual para estados de loading dos graficos.
 * Renderiza um placeholder animado que simula um grafico de linhas/barras/area.
 */

interface ChartSkeletonProps {
  /** Altura do skeleton em pixels (default 240) */
  height?: number;
  /** Variante visual: "line" | "area" | "bar" */
  variant?: "line" | "area" | "bar";
  /** Classes adicionais */
  className?: string;
}

export function ChartSkeleton({
  height = 240,
  variant = "line",
  className,
}: ChartSkeletonProps) {
  return (
    <div
      className={`rounded-xl border border-brand-terciar/10 bg-brand-principal/30 p-4 overflow-hidden ${className || ""}`}
      style={{ height }}
      role="status"
      aria-label="Carregando grafico"
      aria-busy="true"
    >
      <div className="flex items-end justify-between h-full gap-1.5">
        {Array.from({ length: 12 }).map((_, i) => {
          const baseHeight =
            variant === "bar"
              ? 20 + ((i * 37) % 60)
              : 30 + ((i * 23) % 45);

          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-brand-terciar/8 animate-pulse"
              style={{
                height: `${baseHeight}%`,
                animationDelay: `${i * 80}ms`,
                animationDuration: "1200ms",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
