/**
 * Carregamento skeleton para a pagina de metricas.
 *
 * Adaptado para o layout de metricas (mais cards KPI e secoes de graficos).
 */
export default function MetricasLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page title skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-64 rounded-lg bg-brand-terciar/10 animate-pulse" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-brand-terciar/10 animate-pulse" />
      </div>

      {/* KPI Cards skeleton (8 cards em grid responsivo) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-brand-terciar/10 bg-white shadow-sm space-y-3"
          >
            <div className="h-4 w-24 rounded-lg bg-brand-terciar/10 animate-pulse" />
            <div
              className="h-8 w-32 rounded-lg bg-brand-terciar/10 animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
            <div className="h-3 w-20 rounded-lg bg-brand-terciar/10 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Estatisticas de sincronizacao e header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-terciar/10">
        <div className="h-4 w-48 rounded-lg bg-brand-terciar/10 animate-pulse" />
        <div className="h-8 w-32 rounded-lg bg-brand-terciar/10 animate-pulse" />
      </div>

      {/* Graficos placeholders skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4"
          >
            <div className="h-6 w-48 rounded-lg bg-brand-terciar/10 animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, j) => (
                <div
                  key={j}
                  className="h-12 w-full rounded-lg bg-brand-terciar/10 animate-pulse"
                  style={{ animationDelay: `${(i * 6 + j) * 50}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
