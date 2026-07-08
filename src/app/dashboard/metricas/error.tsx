"use client";

import { AlertCircle, RefreshCw, BarChart3 } from "lucide-react";
import Link from "next/link";

interface MetricasErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MetricasError({ error, reset }: MetricasErrorProps) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-brand-terciar/5 border border-brand-terciar/10 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-brand-extra2" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-brand-extra1">
            Nao foi possivel carregar as metricas
          </h2>
          <p className="text-sm text-brand-terciar/70 leading-relaxed">
            Ocorreu um problema ao tentar exibir o dashboard de metricas.
            Tente novamente em instantes.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="text-left p-4 bg-brand-principal rounded-lg border border-brand-terciar/10">
            <summary className="font-mono text-xs text-brand-terciar/60 cursor-pointer">
              Detalhes do erro (apenas desenvolvimento)
            </summary>
            <pre className="mt-2 text-[11px] overflow-x-auto text-brand-terciar/80 whitespace-pre-wrap break-words">
              {error?.message || "Erro desconhecido"}
              {error?.digest ? `\nDigest: ${error.digest}` : ""}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-brand-secundar text-white rounded-lg font-semibold text-sm hover:bg-brand-secundar/90 active:bg-brand-secundar/80 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 border border-brand-terciar/20 text-brand-terciar/80 rounded-lg font-semibold text-sm hover:bg-brand-principal hover:border-brand-terciar/30 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Voltar ao inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
