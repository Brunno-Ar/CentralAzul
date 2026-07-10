"use client";

import { useState } from "react";
import { Calendar, Building2, Smartphone, X, Check } from "lucide-react";
import { useMetricasFilters } from "./use-metricas-filters";
import {
  PERIOD_LABELS,
  PLATFORM_OPTIONS,
  type PeriodFilter,
} from "@/lib/mock/dashboard-metrics";
import { cn } from "@/lib/utils";

const PERIOD_VALUES: Exclude<PeriodFilter, "custom">[] = [7, 30, 90, 365];

export function FiltersBar({ unitOptions }: { unitOptions: { value: string; label: string }[] }) {
  const { filters, setPeriod, setUnit, setPlatform, setCustomDateRange, resetFilters } =
    useMetricasFilters();
  const [showCustomDate, setShowCustomDate] = useState(filters.period === "custom");

  const hasActiveFilters =
    filters.period !== DEFAULT_PERIOD || filters.unit !== "all" || filters.platform !== "all";

  return (
    <div className="space-y-4">
      {/* Period Filter - Botões de período */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm">
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-4 h-4 text-brand-secundar" aria-hidden="true" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60">
            Período
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Selecao de periodo">
          {PERIOD_VALUES.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setShowCustomDate(false);
              }}
              aria-pressed={filters.period === p}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 transform-gpu",
                filters.period === p
                  ? "bg-brand-secundar text-white shadow-sm"
                  : "bg-brand-principal text-brand-terciar/70 hover:bg-brand-principal/60 hover:text-brand-secundar",
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
          <button
            onClick={() => {
              setPeriod("custom");
              setShowCustomDate(true);
            }}
            aria-pressed={filters.period === "custom"}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 transform-gpu",
              filters.period === "custom"
                ? "bg-brand-secundar text-white shadow-sm"
                : "bg-brand-principal text-brand-terciar/70 hover:bg-brand-principal/60 hover:text-brand-secundar",
            )}
          >
            Personalizado
          </button>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {showCustomDate && filters.period === "custom" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-brand-secundar/20 bg-brand-secundar/5">
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-brand-secundar" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-secundar">
              Data Personalizada
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <input
              type="date"
              value={filters.customStartDate || ""}
              onChange={(e) => {
                const end = filters.customEndDate || new Date().toISOString().split("T")[0];
                setCustomDateRange(e.target.value, end);
              }}
              aria-label="Data inicial do periodo personalizado"
              className="px-3 py-1.5 rounded-lg border border-brand-terciar/15 bg-white text-xs text-brand-terciar font-mono focus:outline-none focus:border-brand-secundar/40"
            />
            <span className="text-brand-terciar/40 self-center text-xs" aria-hidden="true">ate</span>
            <input
              type="date"
              value={filters.customEndDate || ""}
              onChange={(e) => {
                const start = filters.customStartDate || new Date().toISOString().split("T")[0];
                setCustomDateRange(start, e.target.value);
              }}
              aria-label="Data final do periodo personalizado"
              className="px-3 py-1.5 rounded-lg border border-brand-terciar/15 bg-white text-xs text-brand-terciar font-mono focus:outline-none focus:border-brand-secundar/40"
            />
          </div>
        </div>
      )}

      {/* Dropdowns: Unidade + Plataforma */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Unit Selector */}
        <div className="flex-1 flex items-center gap-3 p-4 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm">
          <Building2 className="w-4 h-4 text-brand-secundar shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60 shrink-0">
            Unidade
          </span>
          <select
            value={filters.unit}
            onChange={(e) => setUnit(e.target.value)}
            aria-label="Filtrar por unidade de negocio"
            className="flex-1 text-xs font-semibold text-brand-terciar bg-transparent focus:outline-none cursor-pointer"
          >
            {unitOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Selector */}
        <div className="flex-1 flex items-center gap-3 p-4 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm">
          <Smartphone className="w-4 h-4 text-brand-secundar shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60 shrink-0">
            Plataforma
          </span>
          <select
            value={filters.platform}
            onChange={(e) => setPlatform(e.target.value as typeof filters.platform)}
            aria-label="Filtrar por plataforma"
            className="flex-1 text-xs font-semibold text-brand-terciar bg-transparent focus:outline-none cursor-pointer"
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Summary + Reset */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 rounded-xl border border-brand-terciar/10 bg-brand-principal/30">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand-terciar/50">
            <Check className="w-3 h-3 text-brand-secundar" />
            <span>
              Filtros ativos: {getActiveFiltersText(filters, unitOptions)}
            </span>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50/50 px-2 py-1 rounded-lg transition-all duration-200"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        </div>
      )}
    </div>
  );
}

const DEFAULT_PERIOD: PeriodFilter = 30;

function getActiveFiltersText(filters: { period: PeriodFilter; unit: string; platform: string }, unitOptions: { value: string; label: string }[]): string {
  const parts: string[] = [];
  if (filters.period === "custom") {
    parts.push("Período personalizado");
  } else if (filters.period !== DEFAULT_PERIOD) {
    parts.push(PERIOD_LABELS[filters.period as 7 | 30 | 90 | 365]);
  }
  if (filters.unit !== "all") {
    const unit = unitOptions.find((u) => u.value === filters.unit);
    parts.push(unit?.label ?? filters.unit);
  }
  if (filters.platform !== "all") {
    const platform = PLATFORM_OPTIONS.find((p) => p.value === filters.platform);
    parts.push(platform?.label ?? filters.platform);
  }
  return parts.length > 0 ? parts.join(", ") : "Nenhum";
}
