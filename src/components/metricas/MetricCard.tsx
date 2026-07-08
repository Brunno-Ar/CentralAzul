"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  iconColor: string;
  /** Percentual de cambio em relacao ao periodo anterior (ex: 12.5 = +12.5%) */
  change?: number;
  /** Texto descritivo do periodo comparado (ex: "vs 30 dias anteriores") */
  changeLabel?: string;
  /** Index para stagger de animacao */
  index?: number;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  iconColor,
  change,
  changeLabel,
  index = 0,
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut", delay: index * 0.05 }}
      className="p-4 rounded-xl border border-brand-terciar/10 bg-white shadow-sm transform-gpu"
      role="article"
      aria-label={`${label}: ${value}${change !== undefined ? `, ${change >= 0 ? "+" : ""}${change.toFixed(1)}%` : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-lg", iconColor)} aria-hidden="true">
          <Icon className="w-4 h-4" />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
              isPositive && "text-emerald-700 bg-emerald-50",
              isNegative && "text-red-700 bg-red-50"
            )}
            aria-label={isPositive ? "Crescimento" : "Queda"}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-3 h-3" aria-hidden="true" />
            )}
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xl font-bold text-brand-extra1 sm:text-2xl" aria-label={label}>
          {value}
        </p>
        <p className="text-[10px] text-brand-terciar/60 uppercase tracking-wider font-mono mt-1">
          {label}
        </p>
        {changeLabel && (
          <p className="text-[9px] text-brand-terciar/45 mt-0.5">{changeLabel}</p>
        )}
      </div>
    </motion.div>
  );
}
