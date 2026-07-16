/**
 * Shared loading skeleton for the dashboard layout.
 * Displays only the main content area placeholders.
 * Uses animate-pulse with app palette.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page title skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-64 rounded-lg bg-brand-terciar/10 animate-pulse" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-brand-terciar/10 animate-pulse" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-brand-terciar/10 bg-brand-principal p-5 space-y-3"
          >
            <div className="h-4 w-24 rounded-lg bg-brand-terciar/10 animate-pulse" />
            <div
              className="h-8 w-32 rounded-lg bg-brand-terciar/10 animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
            <div className="h-3 w-20 rounded-lg bg-brand-terciar/10 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content blocks skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-xl border border-brand-terciar/10 bg-brand-principal p-5 space-y-4"
          >
            <div className="h-6 w-48 rounded-lg bg-brand-terciar/10 animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="h-12 w-full rounded-lg bg-brand-terciar/10 animate-pulse"
                  style={{ animationDelay: `${(i * 4 + j) * 100}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
