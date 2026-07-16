"use client";

import {
  DollarSign,
  CalendarDays,
  Users,
  TrendingUp,
  Heart,
  Eye,
  Globe,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MetricCard } from "./MetricCard";
import type { MockKPI } from "@/lib/mock/dashboard-metrics";

/**
 * Definicao estruturada de cada KPI do dashboard.
 * Centraliza o mapeamento de icone, label, cor e chave de dados
 * para garantir que todos os 8 KPIs tenham formalmente:
 * - icone
 * - valor principal
 * - comparacao com periodo anterior
 * - indicador de crescimento/queda
 */
interface KpiDefinition {
  key: string;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  /** KPIs que nao tem comparacao (ex: ultima sincronizacao) */
  hideChange?: boolean;
}

const KPI_DEFINITIONS: KpiDefinition[] = [
  {
    key: "receitaTotal",
    label: "Receita Total",
    icon: DollarSign,
    iconColor: "text-amber-600 bg-amber-50",
  },
  {
    key: "receitaMensal",
    label: "Receita Mensal",
    icon: CalendarDays,
    iconColor: "text-amber-700 bg-amber-50",
  },
  {
    key: "seguidoresTotais",
    label: "Seguidores Totais",
    icon: Users,
    iconColor: "text-brand-secundar bg-brand-secundar/10",
  },
  {
    key: "crescimento",
    label: "Crescimento",
    icon: TrendingUp,
    iconColor: "text-emerald-700 bg-emerald-50",
  },
  {
    key: "engagementMedio",
    label: "Engagement Medio",
    icon: Heart,
    iconColor: "text-rose-700 bg-rose-50",
  },
  {
    key: "visualizacoes",
    label: "Visualizacoes",
    icon: Eye,
    iconColor: "text-violet-700 bg-violet-50",
  },
  {
    key: "alcance",
    label: "Alcance",
    icon: Globe,
    iconColor: "text-sky-700 bg-sky-50",
  },
  {
    key: "ultimaSincronizacao",
    label: "Ultima Sincronizacao",
    icon: RefreshCw,
    iconColor: "text-brand-terciar bg-brand-terciar/10",
    hideChange: true,
  },
];

interface KpiGridProps {
  kpis: {
    receitaTotal: MockKPI;
    receitaMensal: MockKPI;
    seguidoresTotais: MockKPI;
    crescimento: MockKPI;
    engagementMedio: MockKPI;
    visualizacoes: MockKPI;
    alcance: MockKPI;
    ultimaSincronizacao: MockKPI;
  };
}

export function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {KPI_DEFINITIONS.map((def, index) => {
        const kpi = kpis[def.key as keyof KpiGridProps["kpis"]];

        return (
          <MetricCard
            key={def.key}
            icon={def.icon}
            label={def.label}
            value={kpi.value}
            iconColor={def.iconColor}
            change={def.hideChange ? undefined : kpi.change}
            changeLabel={def.hideChange ? undefined : kpi.changeLabel}
            index={index}
          />
        );
      })}
    </div>
  );
}
