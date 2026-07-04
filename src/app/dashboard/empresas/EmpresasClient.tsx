"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  LayoutDashboard,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  Search,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";

interface CompanyConfig {
  id: string;
  name: string;
  slug: string;
  color: string;
  holding?: string;
  isActive: boolean;
  showOnHome: boolean;
  order: number;
}

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

interface EmpresasClientProps {
  isLevel1: boolean;
  companies: CompanyConfig[];
  panels: SystemPanel[];
}

export default function EmpresasClient({
  isLevel1,
  companies,
  panels,
}: EmpresasClientProps) {
  const [activeTab, setActiveTab] = useState<"companies" | "panels">("companies");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CompanyConfig | SystemPanel | null>(null);
  const [submitting] = useState(false);
  const [message] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPanels = panels.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item: CompanyConfig | SystemPanel) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingItem(null);
  };

  if (!isLevel1) {
    return (
      <PageWrapper title="Empresas & Painéis">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-lg font-bold text-brand-extra1 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-sm text-brand-terciar/70 max-w-md">
            Você não possui permissão para acessar esta área. Contate um administrador.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Empresas & Painéis">
      <div className="space-y-6 text-brand-terciar">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
              Empresas & Painéis
            </h1>
            <p className="text-xs text-brand-terciar/70 mt-1">
              Gerencie empresas do grupo e painéis de sistema.
            </p>
          </div>

          <button
            onClick={handleNew}
            className="flex items-center justify-center gap-1.5 self-start sm:self-center px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-brand-terciar/10">
          <button
            onClick={() => setActiveTab("companies")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "companies"
                ? "border-brand-secundar text-brand-secundar"
                : "border-transparent text-brand-terciar/60 hover:text-brand-terciar"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 inline-block mr-1" />
            Empresas
          </button>
          <button
            onClick={() => setActiveTab("panels")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "panels"
                ? "border-brand-secundar text-brand-secundar"
                : "border-transparent text-brand-terciar/60 hover:text-brand-terciar"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 inline-block mr-1" />
            Painéis
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-terciar/50" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-brand-terciar/10 rounded-xl text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors shadow-sm"
          />
        </div>

        {/* Content */}
        {activeTab === "companies" ? (
          <div className="space-y-3">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-brand-terciar/20 bg-white rounded-2xl shadow-sm">
                <Building2 className="w-12 h-12 text-brand-terciar/20 mx-auto mb-3" />
                <p className="text-sm text-brand-terciar/50">
                  Nenhuma empresa cadastrada.
                </p>
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="p-4 rounded-xl border border-brand-terciar/10 bg-white hover:border-brand-secundar hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: company.color }}
                      >
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-brand-extra1">
                          {company.name}
                        </h3>
                        <p className="text-xs text-brand-terciar/60">
                          {company.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-1.5 rounded-lg border border-brand-terciar/15 bg-brand-principal/20 text-brand-secundar hover:text-brand-secundar/80 hover:bg-brand-principal/60 cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPanels.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-brand-terciar/20 bg-white rounded-2xl shadow-sm">
                <LayoutDashboard className="w-12 h-12 text-brand-terciar/20 mx-auto mb-3" />
                <p className="text-sm text-brand-terciar/50">
                  Nenhum painel cadastrado.
                </p>
              </div>
            ) : (
              filteredPanels.map((panel) => (
                <div
                  key={panel.id}
                  className="p-4 rounded-xl border border-brand-terciar/10 bg-white hover:border-brand-secundar hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-brand-secundar" />
                      <div>
                        <h3 className="text-sm font-bold text-brand-extra1">
                          {panel.name}
                        </h3>
                        <p className="text-xs text-brand-terciar/60">
                          {panel.category} - {panel.url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(panel)}
                        className="p-1.5 rounded-lg border border-brand-terciar/15 bg-brand-principal/20 text-brand-secundar hover:text-brand-secundar/80 hover:bg-brand-principal/60 cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {formOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
              onClick={handleClose}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
                  <h2 className="text-sm font-bold text-brand-extra1">
                    {editingItem ? "Editar" : "Novo"} {activeTab === "companies" ? "Empresa" : "Painel"}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/50 hover:text-brand-terciar transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {message && (
                    <div
                      className={`p-3 rounded-lg text-xs border mb-4 ${
                        message.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold"
                          : "border-red-200 bg-red-50 text-red-800"
                      }`}
                    >
                      {message.text}
                    </div>
                  )}
                  <p className="text-sm text-brand-terciar/70">
                    Formulário em desenvolvimento.
                  </p>
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-brand-terciar/10">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70 hover:text-brand-extra1 hover:bg-brand-principal/50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
