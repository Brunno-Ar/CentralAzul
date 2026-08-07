"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-lg font-semibold text-brand-extra1">
              Erro ao carregar {title || "a página"}
            </h2>
            <p className="text-brand-terciar/60 mt-2 text-sm">
              Tente recarregar a página ou navegar para outra seção.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}