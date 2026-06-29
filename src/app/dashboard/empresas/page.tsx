"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { SessionUser } from "@/types/auth";
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

export default function EmpresasAdminPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as SessionUser | undefined;
  const isLevel1 =
    currentUser?.hierarchyLevel === 1 || currentUser?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"companies" | "tools">(
    "companies",
  );
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyConfig[]>([]);
  const [panels, setPanels] = useState<SystemPanel[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- Company Form State ---
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyGroup, setCompanyGroup] = useState("AZUL");
  const [companyIsActive, setCompanyIsActive] = useState(true);
  const [companyShowOnHome, setCompanyShowOnHome] = useState(true);

  // --- Tool Form State ---
  const [isCreatingTool, setIsCreatingTool] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolUrl, setToolUrl] = useState("");
  const [toolIcon, setToolIcon] = useState("Building2");
  const [toolCompanySlug, setToolCompanySlug] = useState("");
  const [toolMinRole, setToolMinRole] = useState("VIEWER");
  const [toolMinHierarchy, setToolMinHierarchy] = useState(3);
  const [toolIsActive, setToolIsActive] = useState(true);

  const showFeedback = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    }
  }, []);

  const loadPanels = useCallback(async () => {
    try {
      const res = await fetch("/api/panels");
      if (res.ok) {
        const data = await res.json();
        setPanels(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao carregar ferramentas:", err);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (isLevel1) {
        loadCompanies();
        loadPanels();
      }
      setLoading(false);
    });
  }, [isLevel1, loadCompanies, loadPanels]);

  // --- Company Actions ---
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showFeedback("error", "O nome da empresa e obrigatorio.");
      return;
    }

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          color: companyGroup,
          isActive: companyIsActive,
          showOnHome: companyShowOnHome,
        }),
      });

      if (res.ok) {
        showFeedback("success", "Empresa criada com sucesso.");
        setCompanyName("");
        setCompanyGroup("AZUL");
        setCompanyIsActive(true);
        setCompanyShowOnHome(true);
        setIsCreatingCompany(false);
        loadCompanies();
      } else {
        const err = await res.json();
        showFeedback("error", err.error || "Erro ao criar empresa.");
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Falha de rede ao conectar com o servidor.");
    }
  };

  const handleStartEditCompany = (c: CompanyConfig) => {
    setEditingCompanyId(c.id);
    setCompanyName(c.name);
    setCompanyGroup(c.color);
    setCompanyIsActive(c.isActive);
    setCompanyShowOnHome(c.showOnHome);
    setIsCreatingCompany(false);
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyId) return;

    try {
      const res = await fetch("/api/companies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCompanyId,
          name: companyName,
          color: companyGroup,
          isActive: companyIsActive,
          showOnHome: companyShowOnHome,
        }),
      });

      if (res.ok) {
        showFeedback("success", "Empresa atualizada com sucesso.");
        setEditingCompanyId(null);
        setCompanyName("");
        setCompanyGroup("AZUL");
        setCompanyIsActive(true);
        setCompanyShowOnHome(true);
        loadCompanies();
      } else {
        const err = await res.json();
        showFeedback("error", err.error || "Erro ao atualizar empresa.");
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Falha de rede ao atualizar empresa.");
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;

    try {
      const res = await fetch(`/api/companies?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showFeedback("success", "Empresa excluida com sucesso.");
        loadCompanies();
      } else {
        const err = await res.json();
        showFeedback("error", err.error || "Erro ao excluir empresa.");
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Falha de rede ao excluir empresa.");
    }
  };

  // --- Tool Actions ---
  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName.trim() || !toolUrl.trim()) {
      showFeedback("error", "Nome e URL da ferramenta sao obrigatorios.");
      return;
    }

    try {
      const payload = {
        name: toolName,
        description: toolDescription,
        url: toolUrl,
        icon: toolIcon,
        minRole: toolMinRole,
        minHierarchy: Number(toolMinHierarchy),
        isActive: toolIsActive,
        companySlug: toolCompanySlug || null,
      };

      const res = await fetch("/api/panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showFeedback("success", "Ferramenta cadastrada com sucesso.");
        setToolName("");
        setToolDescription("");
        setToolUrl("");
        setToolIcon("Building2");
        setToolCompanySlug("");
        setToolMinRole("VIEWER");
        setToolMinHierarchy(3);
        setToolIsActive(true);
        setIsCreatingTool(false);
        loadPanels();
      } else {
        const err = await res.json();
        showFeedback("error", err.error || "Erro ao criar ferramenta.");
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Falha de rede ao criar ferramenta.");
    }
  };

  const handleStartEditTool = (p: SystemPanel) => {
    setEditingToolId(p.id);
    setToolName(p.name);
    setToolDescription(p.description);
    setToolUrl(p.url);
    setToolIcon(p.icon);
    setToolCompanySlug(p.companySlug || "");
    setToolMinRole(p.minRole);
    setToolMinHierarchy(p.minHierarchy);
    setToolIsActive(p.isActive);
    setIsCreatingTool(false);
  };

  const handleUpdateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingToolId) return;

    try {
      const res = await fetch("/api/panels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingToolId,
          name: toolName,
          description: toolDescription,
          url: toolUrl,
          icon: toolIcon,
          minRole: toolMinRole,
          minHierarchy: Number(toolMinHierarchy),
          isActive: toolIsActive,
          companySlug: toolCompanySlug || null,
        }),
      });

      if (res.ok) {
        showFeedback("success", "Ferramenta atualizada com sucesso.");
        setEditingToolId(null);
        setToolName("");
        setToolDescription("");
        setToolUrl("");
        setToolIcon("Building2");
        setToolCompanySlug("");
        setToolMinRole("VIEWER");
        setToolMinHierarchy(3);
        setToolIsActive(true);
        loadPanels();
      } else {
        const err = await res.json();
        showFeedback("error", err.error || "Erro ao atualizar ferramenta.");
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Falha de rede ao atualizar ferramenta.");
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ferramenta?")) return;

    try {
      const res = await fetch(`/api/panels?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showFeedback("success", "Ferramenta excluida com sucesso.");
        loadPanels();
      } else {
        const err = await res.json();
        showFeedback("error", err.error || "Erro ao excluir ferramenta.");
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Falha de rede ao excluir ferramenta.");
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Configuracoes">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-secundar border-t-transparent" />
        </div>
      </PageWrapper>
    );
  }

  if (!isLevel1) {
    return (
      <PageWrapper title="Acesso Negado">
        <div className="p-6 rounded-2xl border border-red-250 bg-red-50 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 mb-2 text-red-700" />
          <p className="font-bold">Acesso restrito</p>
          <p className="mt-1">
            Apenas colaboradores com permissao de Administrador (Nivel 1)
            possuem autorizacao para gerenciar empresas e ferramentas.
          </p>
        </div>
      </PageWrapper>
    );
  }

  const motionProps = {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.15 },
  };

  return (
    <PageWrapper title="Empresas & Ferramentas">
      <div className="space-y-6 text-brand-terciar">
        {/* Toggle navigation bar */}
        <div className="flex border-b border-brand-terciar/10 pb-1 gap-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("companies");
              setEditingCompanyId(null);
              setIsCreatingCompany(false);
            }}
            className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === "companies"
                ? "text-brand-secundar"
                : "text-brand-terciar/50 hover:text-brand-secundar"
            }`}
          >
            Divisoes do Grupo
            {activeTab === "companies" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-secundar"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("tools");
              setEditingToolId(null);
              setIsCreatingTool(false);
            }}
            className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === "tools"
                ? "text-brand-secundar"
                : "text-brand-terciar/50 hover:text-brand-secundar"
            }`}
          >
            Ferramentas do Sistema
            {activeTab === "tools" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-secundar"
              />
            )}
          </button>
        </div>

        {/* Banners */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              {...motionProps}
              className={`p-4 rounded-xl border text-xs flex gap-2.5 items-start ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                  : "bg-red-50 border-red-250 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">
                  {message.type === "success" ? "Sucesso" : "Erro de Operacao"}
                </p>
                <p className="opacity-95 mt-0.5">{message.text}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================== */}
        {/* COMPANIES CONTROL PANEL                    */}
        {/* ========================================== */}
        {activeTab === "companies" && (
          <div className="space-y-6">
            {/* Header + Add button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-brand-extra1">
                  Divisoes e Marcas
                </h2>
                <p className="text-[11px] text-brand-terciar/60">
                  Cadastre e configure os cards de visualizacao do Grupo.
                </p>
              </div>
              {!isCreatingCompany && !editingCompanyId && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCompany(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secundar hover:bg-brand-secundar/90 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Divisao
                </button>
              )}
            </div>

            {/* Create Form Container */}
            <AnimatePresence>
              {(isCreatingCompany || editingCompanyId) && (
                <motion.div
                  {...motionProps}
                  className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-brand-terciar/5">
                    <h3 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider">
                      {editingCompanyId ? "Editar Divisao" : "Nova Divisao"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCompany(false);
                        setEditingCompanyId(null);
                        setCompanyName("");
                        setCompanyGroup("AZUL");
                      }}
                      className="text-brand-terciar/40 hover:text-brand-terciar cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={
                      editingCompanyId
                        ? handleUpdateCompany
                        : handleCreateCompany
                    }
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="space-y-1 md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-terciar/60">
                        Nome da Marca
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: Azul Educacional"
                        className="w-full px-3 py-2 border border-brand-terciar/15 rounded-xl text-xs bg-brand-principal/20 focus:outline-none focus:border-brand-secundar text-brand-terciar"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-terciar/60">
                        Holding / Grupo Visual
                      </label>
                      <select
                        value={companyGroup}
                        onChange={(e) => setCompanyGroup(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-terciar/15 rounded-xl text-xs bg-brand-principal/20 focus:outline-none focus:border-brand-secundar text-brand-terciar"
                      >
                        <option value="AZUL">Azul Incorporacoes</option>
                        <option value="BORGO">Borgo del Vino</option>
                        <option value="MAPLE_BEAR">Maple Bear</option>
                        <option value="CENTRAL">Central Geral</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-6 pt-2 md:col-span-2">
                      <button
                        type="button"
                        onClick={() => setCompanyIsActive(!companyIsActive)}
                        className="flex items-center gap-2 text-xs font-semibold cursor-pointer"
                      >
                        {companyIsActive ? (
                          <ToggleRight className="w-8 h-8 text-brand-secundar" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-brand-terciar/35" />
                        )}
                        <span className="text-[11px]">Marca Ativa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompanyShowOnHome(!companyShowOnHome)}
                        className="flex items-center gap-2 text-xs font-semibold cursor-pointer"
                      >
                        {companyShowOnHome ? (
                          <ToggleRight className="w-8 h-8 text-brand-secundar" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-brand-terciar/35" />
                        )}
                        <span className="text-[11px]">Exibir na Home</span>
                      </button>
                    </div>

                    <div className="flex justify-end gap-2 items-center md:col-span-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-secundar hover:bg-brand-secundar/90 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                      >
                        Salvar Empresa
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Companies Grid List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm flex flex-col justify-between h-36"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-brand-extra1 truncate pr-2">
                        {c.name}
                      </h4>
                      <span
                        className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {c.isActive ? "ATIVO" : "INATIVO"}
                      </span>
                    </div>
                    <p className="text-[10px] text-brand-terciar/50 mt-1 font-mono uppercase">
                      Grupo: {c.color}
                    </p>
                    <p className="text-[10px] text-brand-terciar/50 font-mono">
                      Home: {c.showOnHome ? "SIM" : "NAO"}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-brand-terciar/5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleStartEditCompany(c)}
                      className="p-1.5 bg-brand-principal hover:bg-brand-principal/60 rounded-lg text-brand-terciar/60 hover:text-brand-secundar transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCompany(c.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-650 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SYSTEM TOOLS/PANELS CONTROL PANEL          */}
        {/* ========================================== */}
        {activeTab === "tools" && (
          <div className="space-y-6">
            {/* Header + Add button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-brand-extra1">
                  Ferramentas Cadastradas
                </h2>
                <p className="text-[11px] text-brand-terciar/60">
                  Configure as ferramentas e links disponiveis para as marcas.
                </p>
              </div>
              {!isCreatingTool && !editingToolId && (
                <button
                  type="button"
                  onClick={() => setIsCreatingTool(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secundar hover:bg-brand-secundar/90 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Ferramenta
                </button>
              )}
            </div>

            {/* Create/Edit Form Container */}
            <AnimatePresence>
              {(isCreatingTool || editingToolId) && (
                <motion.div
                  {...motionProps}
                  className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-brand-terciar/5">
                    <h3 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider">
                      {editingToolId ? "Editar Ferramenta" : "Nova Ferramenta"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingTool(false);
                        setEditingToolId(null);
                        setToolName("");
                        setToolDescription("");
                        setToolUrl("");
                        setToolIcon("Building2");
                      }}
                      className="text-brand-terciar/40 hover:text-brand-terciar cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={
                      editingToolId ? handleUpdateTool : handleCreateTool
                    }
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="space-y-1 md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-terciar/60">
                        Nome da Ferramenta
                      </label>
                      <input
                        type="text"
                        value={toolName}
                        onChange={(e) => setToolName(e.target.value)}
                        placeholder="Ex: CRM Comercial"
                        className="w-full px-3 py-2 border border-brand-terciar/15 rounded-xl text-xs bg-brand-principal/20 focus:outline-none focus:border-brand-secundar text-brand-terciar"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-terciar/60">
                        Icone
                      </label>
                      <select
                        value={toolIcon}
                        onChange={(e) => setToolIcon(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-terciar/15 rounded-xl text-xs bg-brand-principal/20 focus:outline-none focus:border-brand-secundar text-brand-terciar"
                      >
                        <option value="Building2">
                          Predio (Incorporadora)
                        </option>
                        <option value="Wine">Vinho (Borgo)</option>
                        <option value="GraduationCap">
                          Chapeu Formatura (Maple)
                        </option>
                        <option value="Sliders">
                          Controles (Configuracao)
                        </option>
                        <option value="Shield">Escudo (Seguranca)</option>
                        <option value="Layers">Camadas (Sistemas)</option>
                        <option value="Activity">Atividade (Logs)</option>
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-terciar/60">
                        URL de Acesso
                      </label>
                      <input
                        type="text"
                        value={toolUrl}
                        onChange={(e) => setToolUrl(e.target.value)}
                        placeholder="Ex: https://crm.grupoazul.com"
                        className="w-full px-3 py-2 border border-brand-terciar/15 rounded-xl text-xs bg-brand-principal/20 focus:outline-none focus:border-brand-secundar text-brand-terciar"
                        required
                      />
                    </div>

                    <div className="space-y-1 md:col-span-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-terciar/60">
                        Descricao da Ferramenta
                      </label>
                      <input
                        type="text"
                        value={toolDescription}
                        onChange={(e) => setToolDescription(e.target.value)}
                        placeholder="Ex: Plataforma para gestao e acompanhamento de prospecções de clientes."
                        className="w-full px-3 py-2 border border-brand-terciar/15 rounded-xl text-xs bg-brand-principal/20 focus:outline-none focus:border-brand-secundar text-brand-terciar"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-terciar/60">
                        Cargo Minimo
                      </label>
                      <select
                        value={toolMinRole}
                        onChange={(e) => setToolMinRole(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-terciar/15 rounded-xl text-xs bg-brand-principal/20 focus:outline-none focus:border-brand-secundar text-brand-terciar"
                      >
                        <option value="VIEWER">VIEWER (Leitura)</option>
                        <option value="COORDINATOR">
                          COORDINATOR (Edicao)
                        </option>
                        <option value="ADMIN">ADMIN (Controle Geral)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-terciar/60">
                        Nivel Hierarquico Minimo
                      </label>
                      <select
                        value={toolMinHierarchy}
                        onChange={(e) =>
                          setToolMinHierarchy(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-brand-terciar/15 rounded-xl text-xs bg-brand-principal/20 focus:outline-none focus:border-brand-secundar text-brand-terciar"
                      >
                        <option value={3}>Nivel 3 (Operacional / Geral)</option>
                        <option value={2}>
                          Nivel 2 (Gerencia / Supervisor)
                        </option>
                        <option value={1}>Nivel 1 (Direcao / Admin)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-terciar/60">
                        Empresa Vinculada
                      </label>
                      <select
                        value={toolCompanySlug}
                        onChange={(e) => setToolCompanySlug(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-terciar/15 rounded-xl text-xs bg-brand-principal/20 focus:outline-none focus:border-brand-secundar text-brand-terciar"
                      >
                        <option value="">Global / Central (todas)</option>
                        {companies
                          .filter((c) => c.isActive)
                          .map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-6 pt-2 md:col-span-2">
                      <button
                        type="button"
                        onClick={() => setToolIsActive(!toolIsActive)}
                        className="flex items-center gap-2 text-xs font-semibold cursor-pointer"
                      >
                        {toolIsActive ? (
                          <ToggleRight className="w-8 h-8 text-brand-secundar" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-brand-terciar/35" />
                        )}
                        <span className="text-[11px]">Ferramenta Ativa</span>
                      </button>
                    </div>

                    <div className="flex justify-end gap-2 items-center md:col-span-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-secundar hover:bg-brand-secundar/90 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                      >
                        Salvar Ferramenta
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tools Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {panels.map((p) => {
                const linkedCompany = companies.find(
                  (c) => c.slug === p.companySlug,
                );
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm flex flex-col justify-between min-h-40"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-brand-extra1 truncate pr-2">
                          {p.name}
                        </h4>
                        <span
                          className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            p.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-red-50 text-red-700 border border-red-100"
                          }`}
                        >
                          {p.isActive ? "ATIVO" : "INATIVO"}
                        </span>
                      </div>
                      <p className="text-[10px] text-brand-terciar/70 mt-1 leading-normal line-clamp-2">
                        {p.description || "Sem descricao cadastrada."}
                      </p>

                      <div className="flex gap-2 flex-wrap mt-2">
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-brand-principal text-brand-terciar/60">
                          Icon: {p.icon}
                        </span>
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-brand-principal text-brand-terciar/60">
                          Acesso: {p.minRole} (N{p.minHierarchy})
                        </span>
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-brand-secundar/10 text-brand-secundar font-bold">
                          Empresa:{" "}
                          {linkedCompany
                            ? linkedCompany.name
                            : "Global / Central"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-brand-terciar/5 pt-2 mt-4">
                      <span
                        className="text-[9px] text-brand-terciar/45 font-mono truncate max-w-[200px]"
                        title={p.url}
                      >
                        {p.url}
                      </span>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditTool(p)}
                          className="p-1.5 bg-brand-principal hover:bg-brand-principal/60 rounded-lg text-brand-terciar/60 hover:text-brand-secundar transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTool(p.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-650 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
