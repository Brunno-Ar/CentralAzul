import { useState, useEffect } from "react";
import type { Company } from "@/types/company";

export type { Company };

/**
 * Hook para carregar a lista de empresas de forma dinamica.
 * Retorna as empresas, o estado de carregamento e eventuais erros.
 */
export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function fetchCompanies() {
      try {
        const res = await fetch("/api/companies", { signal: controller.signal });
        if (!res.ok) {
          throw new Error("Erro ao buscar empresas");
        }
        const data = (await res.json()) as unknown;
        if (!Array.isArray(data)) {
          throw new Error("Resposta inesperada da API de empresas");
        }
        if (active) {
          setCompanies(data as Company[]);
          setLoading(false);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        if (active) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }
    fetchCompanies();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { companies, loading, error };
}
