import Link from "next/link";
import { ArrowUpRight, BarChart3, ListTodo, MessageSquare, TrendingUp } from "lucide-react";

const metrics = [
  {
    title: "Instagram e Tráfego",
    description: "Acompanhe os indicadores do Portal CP, incluindo as unidades Cabanas e Vinho.",
    href: "/dashboard/metricas/trafego",
    icon: TrendingUp,
  },
  {
    title: "ClickUp (Tarefas)",
    description: "Veja tarefas, responsáveis, prazos e status do workspace.",
    href: "/dashboard/metricas/clickup",
    icon: ListTodo,
  },
  {
    title: "Connecta",
    description: "Acompanhe conversas, respostas e interesses registrados no WhatsApp.",
    href: "/dashboard/metricas/connecta",
    icon: MessageSquare,
  },
];

export default function MetricasPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 pb-12 text-brand-terciar">
      <header className="border-b border-brand-terciar/10 pb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand-secundar" />
          <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
            Central de Métricas
          </h1>
        </div>
        <p className="mt-1 text-sm text-brand-terciar/70">
          Escolha uma área para carregar seus indicadores.
        </p>
      </header>

      <section aria-label="Áreas de métricas" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-brand-terciar/10 bg-white p-5 shadow-sm transition-colors duration-200 hover:border-brand-secundar/40 hover:bg-brand-principal/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secundar"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-secundar/10">
                <Icon className="h-5 w-5 text-brand-secundar" aria-hidden="true" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-brand-terciar/40 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-secundar" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-base font-bold text-brand-extra1">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-terciar/70">{description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
