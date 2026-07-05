import type { ReactNode } from "react";

/* ============================================================
   EMPTY STATE
   ------------------------------------------------------------
   Estado vazio reutilizavel para listas, galerias e grids.
   Suporta icon, titulo, descricao e uma acao opcional (botao).
   ============================================================ */
export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Acao opcional: pode ser um botao, link ou qualquer ReactNode */
  action?: ReactNode;
  /** Classe extra opcional para customizar o container */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {icon}
      <p className="text-sm font-medium text-brand-terciar/60">{title}</p>
      <p className="text-xs text-brand-terciar/40 mt-1">{description}</p>
      {action}
    </div>
  );
}

