import { ListTodo } from "lucide-react";
import ClickUpMetricsView from "@/components/metricas/clickup-metrics-view";

export default function ClickUpMetricsPage() {
  return (
    <main className="space-y-5 pb-12 text-brand-terciar">
      <header className="border-b border-brand-terciar/10 pb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-brand-secundar" />
          <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
            ClickUp (Tarefas)
          </h1>
        </div>
        <p className="mt-1 text-sm text-brand-terciar/70">
          Acompanhe tarefas, responsáveis, prazos e status do workspace.
        </p>
      </header>
      <ClickUpMetricsView />
    </main>
  );
}
