"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wine, GraduationCap, Building2, ShieldAlert, Notebook,
  DollarSign, CalendarRange, Lock, ExternalLink, Search,
  ShieldAlert as ShieldIcon, Sliders, Filter, X
} from "lucide-react";
import { SessionUser } from "@/types/auth";
import { PageWrapper } from "@/components/PageWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPill } from "@/components/ui/FilterPill";

/* ============================================================
   TYPES
   ============================================================ */
interface SystemPanel {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  minRole: string;
  minHierarchy: number;
  isActive: boolean;
  companySlug?: string | null;
}

interface CompanyConfig {
  id: string;
  name: string;
  slug: string;
  color: string;
}

/* ============================================================
   ICON MAP
   ============================================================ */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wine, GraduationCap, Building2, ShieldAlert, Notebook,
  DollarSign, CalendarRange, ShieldIcon
};

/* ============================================================
   CATEGORY STYLES
   ============================================================ */
const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
  BORGO: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  MAPLE_BEAR: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  AZUL: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
};

const getCategoryStyle = (cat: string, companySlug?: string | null) => {
  const key = (companySlug || cat).toUpperCase();
  return categoryStyles[key] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
};

const getCompanyLabel = (cat: string, companySlug?: string | null, companies: CompanyConfig[] = []) => {
  const slugUpper = (companySlug || cat).toUpperCase();
  const matched = companies.find(c => c.slug.toUpperCase() === slugUpper);
  if (matched) return matched.name;

  switch (slugUpper) {
    case "BORGO": return "Borgo del Vino";
    case "MAPLE_BEAR": return "Maple Bear";
    case "AZUL": return "Azul Incorporacoes";
    default: return companySlug || cat || "Grupo Azul";
  }
};

/* ============================================================
   SKELETON LOADING
   ============================================================ */
function ToolCardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-brand-terciar/10 bg-white animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-5 w-20 bg-brand-terciar/10 rounded" />
        <div className="h-8 w-8 bg-brand-terciar/10 rounded-lg" />
      </div>
      <div className="h-4 w-3/4 bg-brand-terciar/10 rounded mb-2" />
      <div className="h-4 w-1/2 bg-brand-terciar/10 rounded" />
      <div className="mt-6 pt-4 border-t border-brand-terciar/10 flex items-center justify-between">
        <div className="h-4 w-24 bg-brand-terciar/10 rounded" />
        <div className="h-8 w-20 bg-brand-terciar/10 rounded-lg" />
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function FerramentasPage() {
  const { data: session } = useSession();
  const [panels, setPanels] = useState<SystemPanel[]>([]);
  const [companies, setCompanies] = useState<CompanyConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const user = session?.user as SessionUser | undefined;
  const userLevel = user?.hierarchyLevel || 3;

  // Load data from URL params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const companyParam = params.get("company");
      if (companyParam) {
        setActiveFilter(companyParam.toUpperCase());
      }
    }
  }, []);

  // Fetch panels and companies
  useEffect(() => {
    async function loadData() {
      try {
        const [panelsRes, companiesRes] = await Promise.all([
          fetch("/api/panels"),
          fetch("/api/companies")
        ]);
        if (panelsRes.ok) {
          const data = await panelsRes.json();
          setPanels(data);
        }
        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setCompanies(data);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Build filter categories
  const uniquePanelSlugs = Array.from(
    new Set(panels.map((p) => p.companySlug?.toUpperCase()).filter((s): s is string => !!s))
  ).filter((slug) => !companies.some((c) => c.slug.toUpperCase() === slug));

  const categories = [
    { label: "Todos", value: "ALL" },
    ...companies.map(c => ({ label: c.name, value: c.slug.toUpperCase() })),
    ...uniquePanelSlugs.map(slug => ({ label: slug, value: slug }))
  ];

  // Filter panels
  const filteredPanels = panels.filter(panel => {
    const matchesSearch = panel.name.toLowerCase().includes(search.toLowerCase()) ||
                          panel.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "ALL" ||
                          panel.category?.toUpperCase() === activeFilter ||
                          panel.companySlug?.toUpperCase() === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const clearFilters = () => {
    setSearch("");
    setActiveFilter("ALL");
  };

  return (
    <PageWrapper title="Ferramentas">
      <div className="space-y-6">
        {/* === HEADER === */}
        <div>
          <h1 className="text-xl font-bold text-brand-extra1 tracking-tight">
            Ferramentas
          </h1>
          <p className="text-xs text-brand-terciar/60 mt-1">
            Acesse as ferramentas administrativas integradas do grupo. Liberadas conforme seu nivel de acesso.
          </p>
        </div>

        {/* === SEARCH & FILTERS === */}
        <div className="flex flex-col gap-3">
          { /* Search */ }
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-terciar/40" />
              <input
                type="text"
                placeholder="Buscar ferramenta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-brand-terciar/10 rounded-xl text-sm text-brand-terciar placeholder:text-brand-terciar/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-terciar/40 hover:text-brand-terciar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter toggle (mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden p-2.5 rounded-xl border border-brand-terciar/10 bg-white text-brand-terciar/60 hover:text-brand-terciar transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Filter tabs */}
          <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin ${showFilters ? "flex" : "hidden md:flex"}`}>
            {categories.map((cat) => (
              <FilterPill
                key={cat.value}
                label={cat.label}
                active={activeFilter === cat.value}
                onClick={() => setActiveFilter(cat.value)}
              />
            ))}
          </div>
        </div>

        {/* === GRID === */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <ToolCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPanels.length === 0 ? (
          <EmptyState
            icon={<Sliders className="w-10 h-10 text-brand-terciar/20" />}
            title="Nenhuma ferramenta encontrada"
            description="Tente ajustar os filtros ou a busca"
            action={
              <button
                onClick={clearFilters}
                className="mt-3 text-xs font-medium text-brand-primary hover:text-brand-primary-light underline underline-offset-2"
              >
                Limpar filtros
              </button>
            }
            className="col-span-full py-12 border border-dashed border-brand-terciar/20 bg-white rounded-xl"
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredPanels.map((panel) => {
                const hasAccess = userLevel >= panel.minHierarchy;
                const PanelIcon = iconMap[panel.icon] || ShieldAlert;
                const catStyle = getCategoryStyle(panel.category, panel.companySlug);

                return (
                  <motion.div
                    key={panel.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all overflow-hidden ${
                      hasAccess
                        ? "border-brand-terciar/10 bg-white hover:border-brand-primary/30 shadow-sm hover:shadow-md"
                        : "border-brand-terciar/5 bg-brand-terciar/5"
                    }`}
                  >
                    {/* Top info */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          {getCompanyLabel(panel.category, panel.companySlug, companies)}
                        </span>
                        <div className={`p-2 rounded-lg ${hasAccess ? "bg-brand-terciar/5 text-brand-terciar" : "bg-brand-terciar/5 text-brand-terciar/30"}`}>
                          <PanelIcon className="w-4 h-4" />
                        </div>
                      </div>

                      <div className={hasAccess ? "opacity-100" : "opacity-40"}>
                        <h3 className="text-sm font-bold text-brand-extra1 leading-tight">
                          {panel.name}
                        </h3>
                        <p className="text-xs text-brand-terciar/70 mt-1.5 leading-relaxed line-clamp-2">
                          {panel.description}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-5 pt-4 border-t border-brand-terciar/10 flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase font-mono text-brand-terciar/40 tracking-wider">Permissao</span>
                        <span className={`text-[10px] font-mono font-bold ${hasAccess ? "text-emerald-600" : "text-red-500"}`}>
                          N{panel.minHierarchy}+ ({panel.minRole})
                        </span>
                      </div>

                      {hasAccess ? (
                        <a
                          href={panel.url}
                          target={panel.url.startsWith("http") ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white font-semibold rounded-lg text-xs hover:bg-brand-primary-light transition-colors shadow-sm"
                        >
                          Acessar
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-brand-terciar/50 font-mono">
                          <Lock className="w-3.5 h-3.5" />
                          Bloqueado
                        </div>
                      )}
                    </div>

                    {/* Locked overlay */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-brand-terciar/5 backdrop-blur-[1px] pointer-events-none" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
