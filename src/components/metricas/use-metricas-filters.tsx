"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  type MetricasFilters,
  type PeriodFilter,
  type UnitFilter,
  type PlatformFilter,
  DEFAULT_FILTERS,
} from "@/lib/mock/dashboard-metrics";

interface MetricasFiltersContextValue {
  filters: MetricasFilters;
  setPeriod: (period: PeriodFilter) => void;
  setUnit: (unit: UnitFilter) => void;
  setPlatform: (platform: PlatformFilter) => void;
  setCustomDateRange: (startDate: string, endDate: string) => void;
  resetFilters: () => void;
}

const MetricasFiltersContext = createContext<MetricasFiltersContextValue | null>(null);

export function MetricasFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<MetricasFilters>(DEFAULT_FILTERS);

  const setPeriod = useCallback((period: PeriodFilter) => {
    setFilters((prev) => ({
      ...prev,
      period,
      // Limpa datas customizadas se sair do modo personalizado
      customStartDate: period === "custom" ? prev.customStartDate : undefined,
      customEndDate: period === "custom" ? prev.customEndDate : undefined,
    }));
  }, []);

  const setUnit = useCallback((unit: UnitFilter) => {
    setFilters((prev) => ({ ...prev, unit }));
  }, []);

  const setPlatform = useCallback((platform: PlatformFilter) => {
    setFilters((prev) => ({ ...prev, platform }));
  }, []);

  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    setFilters((prev) => ({
      ...prev,
      period: "custom",
      customStartDate: startDate,
      customEndDate: endDate,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const value = useMemo(
    () => ({ filters, setPeriod, setUnit, setPlatform, setCustomDateRange, resetFilters }),
    [filters, setPeriod, setUnit, setPlatform, setCustomDateRange, resetFilters],
  );

  return (
    <MetricasFiltersContext.Provider value={value}>
      {children}
    </MetricasFiltersContext.Provider>
  );
}

export function useMetricasFilters(): MetricasFiltersContextValue {
  const ctx = useContext(MetricasFiltersContext);
  if (!ctx) {
    throw new Error("useMetricasFilters deve ser usado dentro de MetricasFiltersProvider");
  }
  return ctx;
}
