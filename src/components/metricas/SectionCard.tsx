"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  /** Acao opcional no header (ex: botao "Ver Tudo", seletor) */
  action?: ReactNode;
  /** Classes adicionais para o container */
  className?: string;
}

export function SectionCard({
  title,
  icon: Icon,
  children,
  action,
  className,
}: SectionCardProps) {
  return (
    <div
      className={`p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4 ${className || ""}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}
