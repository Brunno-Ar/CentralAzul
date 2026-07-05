"use client";

import type { ReactNode } from "react";

/* ============================================================
   FILTER PILL
   ------------------------------------------------------------
   Botao de filtro tipo pill com estados active/inactive.
   Suporta contador opcional (badge).
   ============================================================ */
export interface FilterPillProps {
  label: ReactNode;
  active?: boolean;
  onClick: () => void;
  count?: number;
  className?: string;
}

export function FilterPill({
  label,
  active = false,
  onClick,
  count,
  className = "",
}: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
        active
          ? "bg-brand-secundar text-white border-brand-secundar shadow-sm"
          : "bg-white border-brand-terciar/10 text-brand-terciar/60 hover:text-brand-secundar hover:bg-brand-principal/20"
      } ${className}`}
    >
      {label}
      {typeof count === "number" && count > 0 && (
        <span
          className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
            active
              ? "bg-white/20 text-white"
              : "bg-brand-terciar/10 text-brand-terciar/70"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

