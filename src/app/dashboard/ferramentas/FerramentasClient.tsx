"use client";

import { useState } from "react";
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
  ShieldAlert as ShieldIcon,
  Plus,
  X,
  Loader2,
  Save,
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { createPanelSchema } from "@/lib/validation";

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Wine,
  GraduationCap,
  Building2,
  ShieldAlert,
  Notebook,
  DollarSign,
  CalendarRange,
  ShieldIcon,
};

interface SystemPanel {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  icon: string;
  category: string;
  minRole: string;
  minHierarchy: number;
  isActive: boolean;
  companySlug?: string | null;
  businessUnitToolId?: string | null;
  locked?: boolean;
}

interface BusinessUnitConfig {
  id: string;
  name: string;
  slug: string;
  company: string;
}

interface CompanyConfig {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface FerramentasClientProps {
  initialPanels: SystemPanel[];
  companies: CompanyConfig[];
  businessUnits: BusinessUnitConfig[];
  userLevel: number;
  initialCompanyFilter: string;
}

export default function FerramentasClient({
  initialPanels,
  companies,
  businessUnits,
  userLevel,
  initialCompanyFilter,
}: FerramentasClientProps) {
  const [panels, setPanels] = useState<SystemPanel[]>(initialPanels);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>(initialCompanyFilter);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const iconOptions = [
    { value: "Wine", label: "Wine" },
    { value: "GraduationCap", label: "GraduationCap" },
    { value: "Building2", label: "Building2" },
    { value: "ShieldAlert", label: "ShieldAlert" },
    { value: "Notebook", label: "Notebook" },
    { value: "DollarSign", label: "DollarSign" },
    { value: "CalendarRange", label: "CalendarRange" },
    { value: "ShieldIcon", label: "ShieldIcon" },
  ];

  const roleOptions = [
    { value: "VIEWER", label: "VIEWER" },
    { value: "COORDINATOR", label: "COORDINATOR" },
    { value: "ADMIN", label: "ADMIN" },
  ];

  const hierarchyOptions = [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
  ];

  const uniquePanelSlugs = Array.from(
    new Set(
      panels
        .map((p) => p.companySlug?.toUpperCase())
        .filter((slug): slug is string => !!slug)
    )
  ).filter((slug) => !companies.some((c) => c.slug.toUpperCase() === slug));

  const categories = [
    { label: "Todos", value: "ALL" },
    ...companies.map((c) => ({
      label: c.name,
      value: c.slug.toUpperCase(),
    })),
    ...uniquePanelSlugs.map((slug) => ({
      label: slug,
      value: slug,
    })),
  ];

  const filteredPanels = panels.filter((panel) => {
    const matchesSearch =
      panel.name.toLowerCase().includes(search.toLowerCase()) ||
      (panel.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === "ALL" ||
      panel.category?.toUpperCase() === activeFilter ||
      panel.companySlug?.toUpperCase() === activeFilter;
    return matchesSearch && matchesFilter;
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      url: formData.get("url") as string,
      icon: formData.get("icon") as string,
      category: (formData.get("category") as string) || "GERAL",
      minRole: (formData.get("minRole") as string) || "VIEWER",
      minHierarchy: Number(formData.get("minHierarchy") || 3),
      companySlug: (formData.get("companySlug") as string) || null,
    };

    const validation = createPanelSchema.safeParse(data);
    if (!validation.success) {
      const errorMessages = validation.error.issues.map((issue) => issue.message).join("; ");
      setMessage({ type: "error", text: errorMessages });
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: err.error || "Erro ao criar ferramenta" });
        setSubmitting(false);
        return;
      }

      setMessage({ type: "success", text: "Ferramenta criada com sucesso!" });
      setShowCreateModal(false);
      const [panelsRes, businessUnitsRes] = await Promise.all([
        fetch("/api/panels"),
        fetch("/api/business-units"),
      ]);
      if (panelsRes.ok) {
        const data = await panelsRes.json();
        if (businessUnitsRes.ok) {
          const businessUnits = await businessUnitsRes.json();
          const syncedToolIds = new Set(
            data
              .map((p: SystemPanel) => p.businessUnitToolId)
              .filter((id: string | null): id is string => !!id),
          );
          for (const bu of businessUnits) {
            if (!bu.tools) continue;
            for (const tool of bu.tools) {
              if (syncedToolIds.has(tool.id)) continue;
              data.push({
                id: `bu-tool-${tool.id}`,
                name: tool.name,
                description: tool.description,
                url: tool.url,
                icon: tool.icon || "ShieldAlert",
                category: bu.company,
                minRole: "VIEWER",
                minHierarchy: 3,
                isActive: tool.isActive,
                companySlug: bu.slug,
                businessUnitToolId: tool.id,
                locked: false,
              });
            }
          }
        }
        setPanels(data);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erro ao criar ferramenta" });
    } finally {
      setSubmitting(false);
    }
  }

  const getCategoryColor = (cat: string, companySlug?: string | null) => {
    const slugUpper = (companySlug || cat).toUpperCase();
    
    // Tenta achar a empresa ou a empresa mãe da unidade
    const matchedCompany = companies.find((c) => c.slug.toUpperCase() === slugUpper);
    const matchedUnit = businessUnits.find((bu) => bu.slug.toUpperCase() === slugUpper);
    const companyOfUnit = matchedUnit ? companies.find((c) => c.slug.toUpperCase() === matchedUnit.company.toUpperCase()) : null;
    
    const compColor = (matchedCompany?.color || companyOfUnit?.color || slugUpper).toUpperCase();

    switch (compColor) {
      case "WINE":
        return "text-brand-terciar bg-brand-terciar/10 border-brand-terciar/20";
      case "RED":
        return "text-brand-secundar bg-brand-secundar/10 border-brand-secundar/20";
      case "AZUL":
        return "text-brand-extra2 bg-brand-extra2/10 border-brand-extra2/20";
      case "GOLD":
        return "text-brand-extra1 bg-brand-principal border-brand-secundar/20";
      case "BRONZE":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "GREEN":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "BLUE":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "PURPLE":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-brand-extra1 bg-brand-principal border-brand-secundar/20";
    }
  };

  const getCompanyLabel = (cat: string, companySlug?: string | null) => {
    const slugUpper = (companySlug || cat).toUpperCase();
    const matchedCompany = companies.find((c) => c.slug.toUpperCase() === slugUpper);
    if (matchedCompany) return matchedCompany.name;

    const matchedUnit = businessUnits.find((bu) => bu.slug.toUpperCase() === slugUpper);
    if (matchedUnit) return matchedUnit.name;

    // Fallbacks para compatibilidade
    switch (slugUpper) {
      case "BORGO":
        return "Borgo del Vino";
      case "MAPLE_BEAR":
        return "Maple Bear";
      case "AZUL":
        return "Azul Incorporacoes";
      default:
        return companySlug || cat || "Grupo Azul Central";
    }
  };

  return (
    <PageWrapper title="Ferramentas">
      <div className="space-y-6 text-brand-terciar">
        {/* Title block */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
              Ferramentas
            </h1>
            <p className="text-xs text-brand-terciar/70 mt-1">
              Acesse as ferramentas administrativas integradas do grupo. As ferramentas sao liberadas conforme seu nivel de acesso.
            </p>
          </div>
          {userLevel === 1 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Criar Ferramenta
            </button>
          )}
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg text-xs border ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Search & Tabs - Mobile First */}
        <div className="flex flex-col gap-4 py-2 border-y border-brand-terciar/10 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-terciar/50" />
            <input
              type="text"
              placeholder="Buscar ferramenta..."
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
        {filteredPanels.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-brand-terciar/20 bg-white rounded-2xl shadow-sm">
            <p className="text-sm text-brand-terciar/50">Nenhuma ferramenta encontrada com os filtros aplicados.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredPanels.map((panel) => {
                const hasAccess = !panel.locked;
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(panel.category, panel.companySlug)}`}>
                          {getCompanyLabel(panel.category, panel.companySlug)}
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
                          {panel.description || (hasAccess ? "" : "Acesso restrito")}
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
                          href={panel.url || "#"}
                          target={panel.url?.startsWith("http") ? "_blank" : "_self"}
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

        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onMouseDown={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 overflow-hidden max-h-[90vh] flex flex-col"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
                <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Ferramenta
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/50 hover:text-brand-terciar transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleCreate}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {message && (
                  <div
                    className={`p-3 rounded-lg text-xs border ${
                      message.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-800"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Nome *
                    </label>
                    <input
                      name="name"
                      required
                      placeholder="Ex: Relatorio Financeiro"
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Descricao
                    </label>
                    <input
                      name="description"
                      placeholder="Descreva a ferramenta..."
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      URL *
                    </label>
                    <input
                      name="url"
                      type="url"
                      required
                      placeholder="https://exemplo.com"
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Icone *
                    </label>
                    <select
                      name="icon"
                      required
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="">Selecione</option>
                      {iconOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Categoria
                    </label>
                    <select
                      name="category"
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                    >
                      {[
                        { value: "GERAL", label: "Geral" },
                        ...companies.map((c) => ({ value: c.slug.toUpperCase(), label: c.name })),
                      ].map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                        Cargo Minimo
                      </label>
                      <select
                        name="minRole"
                        className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                      >
                        {roleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                        Hierarquia Minima
                      </label>
                      <select
                        name="minHierarchy"
                        className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                      >
                        {hierarchyOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Vincular a Empresa / Unidade de Negócio
                    </label>
                    <select
                      name="companySlug"
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="">Nenhum (Geral / Holding)</option>
                      <optgroup label="Empresas / Grupos">
                        {companies.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Unidades de Negócio">
                        {businessUnits.map((bu) => (
                          <option key={bu.id} value={bu.slug}>
                            {bu.name} ({bu.company})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-brand-terciar/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70 hover:text-brand-extra1 hover:bg-brand-principal/50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 shadow-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Criar Ferramenta
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
