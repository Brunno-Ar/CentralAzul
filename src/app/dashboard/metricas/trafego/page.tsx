import { TrendingUp } from "lucide-react";
import PortalMetricsView from "@/components/portal-metrics-view";

export default function TrafegoMetricsPage() {
  return (
    <main className="space-y-5 pb-12 text-brand-terciar">
      <header className="border-b border-brand-terciar/10 pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-secundar" />
          <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
            Instagram e Tráfego
          </h1>
        </div>
        <p className="mt-1 text-sm text-brand-terciar/70">
          Indicadores do Portal CP para as unidades Cabanas e Vinho.
        </p>
      </header>
      <PortalMetricsView />
    </main>
  );
}
