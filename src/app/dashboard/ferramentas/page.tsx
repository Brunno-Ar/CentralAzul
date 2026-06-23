"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wine, 
  GraduationCap, 
  Building2, 
  ShieldAlert, 
  Notebook, 
  DollarSign, 
  CalendarRange, 
  Lock, 
  ExternalLink,
  Search,
  Sliders,
  ShieldAlert as ShieldIcon
} from "lucide-react";

const iconMap: { [key: string]: any } = {
  Wine,
  GraduationCap,
  Building2,
  ShieldAlert,
  Notebook,
  DollarSign,
  CalendarRange,
  ShieldIcon
};

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
}

export default function SistemasPage() {
  const { data: session } = useSession();
  const [panels, setPanels] = useState<SystemPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const user = session?.user as any;
  const userRole = user?.role || "VIEWER";
  const userLevel = user?.hierarchyLevel || 3;

  useEffect(() => {
    async function loadPanels() {
      try {
        const response = await fetch("/api/panels");
        if (response.ok) {
          const data = await response.json();
          setPanels(data);
        }
      } catch (err) {
        console.error("Erro ao carregar paineis:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPanels();
  }, []);

  const categories = [
    { label: "Todos", value: "ALL" },
    { label: "Borgo del Vin", value: "BORGO" },
    { label: "Maple Bear", value: "MAPLE_BEAR" },
    { label: "Azul Incorp", value: "AZUL" },
    { label: "Central", value: "CENTRAL" },
  ];

  const filteredPanels = panels.filter(panel => {
    const matchesSearch = panel.name.toLowerCase().includes(search.toLowerCase()) || 
                          panel.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "ALL" || panel.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "BORGO": return "text-brand-terciar bg-brand-terciar/10 border-brand-terciar/20";
      case "MAPLE_BEAR": return "text-brand-secundar bg-brand-secundar/10 border-brand-secundar/20";
      case "AZUL": return "text-brand-extra2 bg-brand-extra2/10 border-brand-extra2/20";
      default: return "text-brand-extra1 bg-brand-principal border-brand-secundar/20";
    }
  };

  const getCompanyLabel = (cat: string) => {
    switch (cat) {
      case "BORGO": return "Borgo del Vin";
      case "MAPLE_BEAR": return "Maple Bear";
      case "AZUL": return "Azul Incorporacoes";
      default: return "Grupo Azul Central";
    }
  };

  return (
    <div className="space-y-6 text-brand-terciar">
      {/* Title block */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
          Central de Sistemas
        </h1>
        <p className="text-xs text-brand-terciar/70 mt-1">
          Acesse os paineis administrativos integrados do grupo. Os sistemas sao liberados conforme seu nivel de acesso.
        </p>
      </div>

      {/* Search & Tabs - Mobile First */}
      <div className="flex flex-col gap-4 py-2 border-y border-brand-terciar/10 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-terciar/50" />
          <input
            type="text"
            placeholder="Buscar painel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-brand-terciar/10 rounded-xl text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors shadow-sm"
          />
        </div>

        {/* Filter Tabs - horizontal scroll on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none w-full sm:w-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveFilter(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === cat.value
                  ? "bg-brand-secundar text-white border-brand-secundar shadow-sm"
                  : "bg-white border-brand-terciar/10 text-brand-terciar/60 hover:text-brand-secundar hover:bg-brand-principal/20"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 bg-white animate-pulse rounded-2xl border border-brand-terciar/10" />
          ))}
        </div>
      ) : filteredPanels.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-brand-terciar/20 bg-white rounded-2xl shadow-sm">
          <p className="text-sm text-brand-terciar/50">Nenhum sistema encontrado com os filtros aplicados.</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredPanels.map((panel) => {
              const hasAccess = userLevel <= panel.minHierarchy;
              const PanelIcon = iconMap[panel.icon] || ShieldAlert;

              return (
                <motion.div
                  key={panel.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all overflow-hidden ${
                    hasAccess 
                      ? "border-brand-terciar/10 bg-white hover:border-brand-secundar shadow-sm hover:shadow-md" 
                      : "border-brand-terciar/5 bg-brand-principal/40"
                  }`}
                >
                  {/* Decorative glowing gradient for unlocked systems */}
                  {hasAccess && (
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-secundar/5 blur-[25px] pointer-events-none" />
                  )}

                  {/* Top info */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-start w-full">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(panel.category)}`}>
                        {getCompanyLabel(panel.category)}
                      </span>
                      
                      <div className={`p-2 rounded-xl ${hasAccess ? "bg-brand-principal text-brand-extra1" : "bg-brand-principal/20 text-brand-terciar/30"}`}>
                        <PanelIcon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className={hasAccess ? "opacity-100" : "opacity-40"}>
                      <h3 className="text-sm font-bold text-brand-extra1 leading-tight">
                        {panel.name}
                      </h3>
                      <p className="text-xs text-brand-terciar/80 mt-2 leading-relaxed min-h-[48px]">
                        {panel.description}
                      </p>
                    </div>
                  </div>

                  {/* Requirements / Action */}
                  <div className="mt-6 pt-4 border-t border-brand-terciar/10 flex items-center justify-between">
                    {/* Security credentials info */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase font-mono text-brand-terciar/50 tracking-wider">Permissao</span>
                      <span className={`text-[10px] font-mono font-bold ${hasAccess ? "text-emerald-700" : "text-red-700"}`}>
                        Nivel {panel.minHierarchy}+ ({panel.minRole})
                      </span>
                    </div>

                    {/* Unlocked button or locked message */}
                    {hasAccess ? (
                      <a
                        href={panel.url}
                        target={panel.url.startsWith("http") ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 transition-colors shadow-sm cursor-pointer"
                      >
                        Acessar
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-brand-terciar/60 font-mono py-1">
                        <Lock className="w-3.5 h-3.5 text-brand-terciar/30" />
                        Bloqueado
                      </div>
                    )}
                  </div>

                  {/* Locked overlay screen */}
                  {!hasAccess && (
                    <div className="absolute inset-0 bg-brand-principal/30 backdrop-blur-[1.5px] pointer-events-none transition-all" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
