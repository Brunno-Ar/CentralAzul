"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // In production, send to error tracking service (Sentry, etc.)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-extra1">
                Ops! Algo deu errado
              </h2>
              <p className="text-brand-terciar/70 mt-2">
                Encontramos um problema inesperado. Nossa equipe foi notificada.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 text-left p-4 bg-brand-principal rounded-lg border border-brand-terciar/10">
                  <summary className="font-mono text-xs text-brand-terciar/60 cursor-pointer">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <pre className="mt-2 text-[11px] overflow-x-auto text-brand-terciar/80">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-brand-secundar text-white rounded-lg hover:bg-brand-secundar/90 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-brand-terciar/20 text-brand-terciar/80 rounded-lg hover:bg-brand-principal transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ir para o Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for programmatic error boundary reset
export function useErrorBoundary() {
  // This would need a context provider for full implementation
  // For now, we just expose the concept
  return {
    reset: () => {
      // Would trigger reset via context
    },
  };
}