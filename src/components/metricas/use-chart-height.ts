"use client";

import { useState, useEffect } from "react";

/**
 * Hook para obter altura responsiva de graficos baseada no viewport.
 *
 * Em telas pequenas (mobile), reduz a altura para economizar espaco vertical
 * sem comprometer a legibilidade.	evita re-renders desnecessarios usando
 * threshold breakpoints (so atualiza ao cruzar um breakpoint).
 *
 * @param baseHeight Altura padrao para desktop (default 240)
 * @returns Altura ajustada para o viewport atual
 */
export function useChartHeight(baseHeight: number = 240): number {
  const [height, setHeight] = useState(baseHeight);

  useEffect(() => {
    function updateHeight() {
      const w = window.innerWidth;
      // Mobile (<640px): 60% da altura base, minimo 160px
      // Tablet (640-1024px): 80% da altura base
      // Desktop (>1024px): altura base completa
      let adjusted: number;
      if (w < 640) {
        adjusted = Math.max(Math.round(baseHeight * 0.6), 160);
      } else if (w < 1024) {
        adjusted = Math.round(baseHeight * 0.8);
      } else {
        adjusted = baseHeight;
      }

      setHeight((prev) => (prev !== adjusted ? adjusted : prev));
    }

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [baseHeight]);

  return height;
}
