"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Building2 } from "lucide-react";
import type { MockUnitMetric } from "@/lib/mock/dashboard-metrics";

/**
 * Seletor multi-selecao para escolher quais unidades de negocio comparar.
 *
 * Features:
 * - Dropdown com checkboxes para cada unidade
 * - Toggle individual + botao "Selecionar todas"
 * - Fecha ao clicar fora (useEffect + ref)
 * - Mostra contador de unidades selecionadas no botao
 * - Animacao suave de abertura/fechamento (tween 0.2s)
 * - Acessivel: role, aria-expanded, aria-label
 */

interface ComparisonUnitSelectorProps {
  /** Lista completa de unidades disponiveis */
  units: MockUnitMetric[];
  /** Slugs das unidades atualmente selecionadas */
  selectedSlugs: string[];
  /** Callback quando a selecao muda */
  onChange: (slugs: string[]) => void;
}

export function ComparisonUnitSelector({
  units,
  selectedSlugs,
  onChange,
}: ComparisonUnitSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const allSlugs = units.map((u) => u.slug);
  const allSelected =
    selectedSlugs.length === allSlugs.length && allSlugs.length > 0;

  function toggleUnit(slug: string) {
    if (selectedSlugs.includes(slug)) {
      // Evita ficar com zero unidades selecionadas
      if (selectedSlugs.length > 1) {
        onChange(selectedSlugs.filter((s) => s !== slug));
      }
    } else {
      onChange([...selectedSlugs, slug]);
    }
  }

  function toggleAll() {
    if (allSelected) {
      // Mantem pelo menos a primeira unidade selecionada
      onChange([allSlugs[0]]);
    } else {
      onChange(allSlugs);
    }
  }

  const buttonLabel =
    selectedSlugs.length === 0
      ? "Selecionar unidades"
      : selectedSlugs.length === 1
        ? units.find((u) => u.slug === selectedSlugs[0])?.name ?? "1 unidade"
        : `${selectedSlugs.length} unidades selecionadas`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Selecionar unidades para comparar"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-terciar/15 bg-white text-xs font-semibold text-brand-terciar hover:bg-brand-principal/30 transition-colors duration-200 easeInOut"
      >
        <Building2 className="w-3.5 h-3.5 text-brand-secundar" />
        <span className="truncate max-w-[200px]">{buttonLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-brand-terciar/50 transition-transform duration-200 easeInOut ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-20 w-72 rounded-xl border border-brand-terciar/15 bg-white shadow-lg overflow-hidden animate-in fade-in duration-200">
          {/* Cabecalho com toggle all */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-brand-terciar/10 bg-brand-principal/30">
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60">
              Unidades
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[10px] font-bold text-brand-secundar hover:text-brand-secundar/80 transition-colors"
            >
              {allSelected ? "Limpar" : "Todas"}
            </button>
          </div>

          {/* Lista de unidades com checkboxes */}
          <div className="max-h-56 overflow-y-auto">
            {units.map((unit) => {
              const isSelected = selectedSlugs.includes(unit.slug);
              return (
                <button
                  key={unit.slug}
                  type="button"
                  onClick={() => toggleUnit(unit.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-principal/30 transition-colors duration-150 easeInOut"
                >
                  <span
                    className={`flex items-center justify-center w-4 h-4 rounded border transition-colors duration-200 easeInOut ${
                      isSelected
                        ? "bg-brand-secundar border-brand-secundar"
                        : "border-brand-terciar/30 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span className="text-xs text-brand-extra1 font-medium truncate">
                    {unit.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
