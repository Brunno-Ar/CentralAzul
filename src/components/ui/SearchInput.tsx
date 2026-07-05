"use client";

import { Search } from "lucide-react";

/* ============================================================
   SEARCH INPUT
   ------------------------------------------------------------
   Input de busca reutilizavel com icone de lupa a esquerda.
   ============================================================ */
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
}: SearchInputProps) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-terciar/50" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-9 pr-4 py-2 bg-white border border-brand-terciar/10 rounded-xl text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors shadow-sm ${className}`}
      />
    </div>
  );
}

