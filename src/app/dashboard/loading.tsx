/**
 * Shared loading skeleton for the dashboard layout.
 * Mirrors the dashboard shell: sidebar nav placeholder + main content area.
 * Uses animate-pulse with app palette (no bright red, no emojis).
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-brand-principal text-brand-terciar font-sans">
      {/* Sidebar / Nav skeleton */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 p-4 border-r border-brand-terciar/10 gap-4">
        <div className="h-10 w-full rounded-lg bg-brand-terciar/10 animate-pulse" />
        <div className="flex-1 flex flex-col gap-3 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-full rounded-lg bg-brand-terciar/10 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <div className="h-12 w-full rounded-lg bg-brand-terciar/10 animate-pulse" />
      </div>

      {/* Mobile nav skeleton */}
      <div className="md:hidden h-14 fixed top-0 inset-x-0 z-10 bg-brand-principal border-b border-brand-terciar/10 flex items-center px-4">
        <div className="h-8 w-8 rounded-lg bg-brand-terciar/10 animate-pulse" />
        <div className="ml-3 h-6 w-32 rounded-lg bg-brand-terciar/10 animate-pulse" />
      </div>

      {/* Main content skeleton */}
      <main className="flex-1 flex flex-col min-h-screen pt-14 md:pt-0 overflow-x-hidden">
        {/* Subtle background glow placeholder */}
        <div className="fixed top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-extra2/5 blur-[120px] pointer-events-none z-0" />

        <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 relative z-10 flex flex-col gap-6">
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
      </main>
    </div>
  );
}
