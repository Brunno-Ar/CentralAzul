import { MessageSquare } from "lucide-react";
import ConnectaMetricsView from "@/components/metricas/connecta-metrics-view";

export default function ConnectaMetricsPage() {
  return (
    <main className="space-y-5 pb-12 text-brand-terciar">
      <header className="border-b border-brand-terciar/10 pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-brand-secundar" />
          <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
            Connecta
          </h1>
        </div>
        <p className="mt-1 text-sm text-brand-terciar/70">
          Indicadores de conversas, respostas e interesses do WhatsApp.
        </p>
      </header>
      <ConnectaMetricsView />
    </main>
  );
}
