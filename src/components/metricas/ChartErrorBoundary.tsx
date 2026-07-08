"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

/**
 * ErrorBoundary que captura erros de renderizacao dos graficos
 * e exibe um estado de erro amigavel em vez de quebrar a pagina inteira.
 *
 * O dashboard de metricas envolve varios graficos complexos (recharts),
 * cada um dos quais pode falhar por razoes independentes (dados invalidos,
 * problemas de layout do ResponsiveContainer, etc). Este boundary garante
 * que uma falha em um grafico nao derrube os demais.
 *
 * Features:
 * - Estado de erro com icone, mensagem e botao de retry
 * - Estilo consistente com o padrao visual do sistema
 * - Acessivel: role="alert", aria-live
 * - Mensagem tecnicaICH alternativa para desenvolvimento
 */

interface ChartErrorBoundaryProps {
  children: ReactNode;
  /** Nome do grafico exibido na mensagem de erro (ex: "Evolucao de Receita") */
  chartName?: string;
  /** Altura do fallback de erro (deve corresponder ao grafico) */
  height?: number;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { chartName = "Grafico", height = 240 } = this.props;

      return (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-brand-terciar/10 bg-brand-principal/20 p-4 text-center"
          style={{ minHeight: height }}
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-8 h-8 text-red-500/70" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-brand-extra1">
              Nao foi possivel carregar: {chartName}
            </p>
            <p className="text-[10px] text-brand-terciar/60 font-mono">
              Tente novamente em instantes.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="text-[10px] font-bold text-brand-secundar hover:text-brand-secundar/80 px-3 py-1.5 rounded-lg border border-brand-secundar/20 hover:bg-brand-secundar/5 transition-colors duration-200 easeInOut"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
