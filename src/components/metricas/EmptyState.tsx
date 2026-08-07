"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/**
 * Estado vazio reutilizavel para secoes do dashboard de metricas.
 *
 * Exibido quando uma secao de grafico nao tem dados para mostrar
 * (ex: filtro de plataforma seleciona uma unica plataforma e o
 * comparativo entre unidades fica sem dados para comparar).
 *
 * Design:
 * - Visual discreto, alinhado com o padrao do sistema
 * - Sem emojis, sem travessoes longos
 * - Acessivel: role="status", aria-label
 * - Altura configuravel para corresponder ao grafico substituido
 */

interface EmptyStateProps {
  /** Icone a exibir (default: Inbox) */
  icon?: LucideIcon;
  /** Titulo curto do estado vazio */
  title: string;
  /** Descricao auxiliar opcional */
  description?: string;
  /** Altura minima do container (deve corresponder ao grafico) */
  height?: number;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  height = 240,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-brand-terciar/10 bg-brand-principal/10 p-6 text-center"
      style={{ minHeight: height }}
      role="status"
      aria-label={title}
    >
      <Icon className="w-8 h-8 text-brand-terciar/30" />
      <div className="space-y-1">
        <p className="text-xs font-bold text-brand-extra1">{title}</p>
        {description && (
          <p className="text-[10px] text-brand-terciar/60 max-w-xs leading-normal">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
