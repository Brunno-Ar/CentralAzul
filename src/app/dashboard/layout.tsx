"use client";

import { useEffect, useState } from "react";
import DashboardNav from "@/components/dashboard-nav";
import { GlobalSearch } from "@/components/ui/global-search";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <div className="flex flex-col md:flex-row min-h-screen bg-brand-background text-brand-foreground font-sans">
        {/* Navigation Sidebar / Drawer */}
        <DashboardNav />

        {/* Content Container */}
        <main className="flex-1 flex flex-col min-h-screen pt-14 md:pt-0 overflow-x-hidden">
          {/* Subtle background glow */}
          <div className="fixed top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none z-0" />

          <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 relative z-10 flex flex-col">
            {children}
          </div>
        </main>

        {/* Global Search Modal */}
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </ErrorBoundary>
  );
}
