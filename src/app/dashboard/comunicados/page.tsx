"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Pin,
  Calendar,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useForm, Resolver, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SessionUser } from "@/types/auth";
import { PageWrapper } from "@/components/PageWrapper";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetCompanies: string;
  expiresAt: string | null;
  isPinned: boolean;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  read: boolean;
}

const priorityOptions = [
  {
    value: "INFO",
    label: "Informativo",
    icon: Info,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    value: "WARNING",
    label: "Atenção",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    value: "IMPORTANT",
    label: "Importante",
    icon: CheckCircle,
    color: "text-red-600 bg-red-50 border-red-200",
  },
];

const companyOptions = [
  { value: "ALL", label: "Todas as empresas" },
  { value: "CENTRAL", label: "Central / Geral" },
  { value: "BORGO", label: "Borgo del Vin" },
  { value: "MAPLE_BEAR", label: "Maple Bear" },
  { value: "AZUL", label: "Azul Incorporações" },
];

const companyColors: Record<string, string> = {
  CENTRAL: "text-brand-extra1 bg-brand-principal/20 border-brand-secundar/30",
  BORGO: "text-brand-terciar bg-brand-terciar/10 border-brand-terciar/30",
  MAPLE_BEAR:
    "text-brand-secundar bg-brand-secundar/10 border-brand-secundar/30",
  AZUL: "text-brand-extra2 bg-brand-extra2/10 border-brand-extra2/30",
};

const formSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  content: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres"),
  priority: z.string(),
  targetCompanies: z.string().optional(),
  expiresAt: z.string().optional(),
  isPinned: z.boolean(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export default function ComunicadosPage() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const user = session?.user as SessionUser | undefined;
  const userLevel = user?.hierarchyLevel || 3;
  const isAdminOrCoord = userLevel <= 2;
  const isAdmin = userLevel === 1;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormData>,
    defaultValues: {
      priority: "INFO",
      isPinned: false,
      isActive: true,
    },
  });

  const loadAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error("Erro ao carregar comunicados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAnnouncements();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesSearch =
      ann.title.toLowerCase().includes(search.toLowerCase()) ||
      ann.content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === "ALL" || ann.priority === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleSubmitForm: SubmitHandler<FormData> = async (data) => {
    setSubmitting(true);
    setMessage(null);

    try {
      const url = editingAnn
        ? `/api/announcements/${editingAnn.id}`
        : "/api/announcements";
      const method = editingAnn ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: editingAnn
            ? "Comunicado atualizado com sucesso"
            : "Comunicado criado com sucesso",
        });
        reset();
        setEditingAnn(null);
        setFormOpen(false);
        await loadAnnouncements();
      } else {
        const errData = await res.json();
        setMessage({
          type: "error",
          text: errData.error || "Erro ao salvar comunicado",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Erro na conexão com o servidor" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    const companies = ann.targetCompanies
      ? ann.targetCompanies.split(",").filter(Boolean)
      : ["ALL"];
    setSelectedCompanies(companies);
    reset({
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      targetCompanies: ann.targetCompanies,
      expiresAt: ann.expiresAt
        ? new Date(ann.expiresAt).toISOString().split("T")[0]
        : "",
      isPinned: ann.isPinned,
      isActive: ann.isActive,
    });
    setFormOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir o comunicado "${title}"?`))
      return;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Comunicado removido com sucesso",
        });
        await loadAnnouncements();
      } else {
        const errData = await res.json();
        setMessage({
          type: "error",
          text: errData.error || "Erro ao remover comunicado",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Erro na conexão com o servidor" });
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/announcements/${id}/read`, { method: "POST" });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
      );
    } catch (err) {
      console.error("Erro ao marcar como lido:", err);
    }
  };

  const handleNew = () => {
    setEditingAnn(null);
    setSelectedCompanies(["ALL"]);
    reset({
      priority: "INFO",
      isPinned: false,
      isActive: true,
    });
    setFormOpen(true);
  };

  const getPriorityLabel = (priority: string) => {
    const opt = priorityOptions.find((o) => o.value === priority);
    return opt ? opt.label : priority;
  };

  const getPriorityIcon = (priority: string) => {
    const opt = priorityOptions.find((o) => o.value === priority);
    return opt ? (
      <opt.icon className="w-3.5 h-3.5" />
    ) : (
      <Info className="w-3.5 h-3.5" />
    );
  };

  const getPriorityColor = (priority: string) => {
    const opt = priorityOptions.find((o) => o.value === priority);
    return opt
      ? opt.color
      : "text-brand-secundar bg-brand-principal border-brand-terciar/20";
  };

  const getCompanyLabel = (value: string) => {
    const opt = companyOptions.find((o) => o.value === value);
    return opt ? opt.label : value;
  };

  const getTargetCompaniesDisplay = (target: string) => {
    if (!target || !target.trim()) return ["Todas as empresas"];
    return target
      .split(",")
      .map((t) => getCompanyLabel(t.trim()))
      .filter(Boolean);
  };

  const toggleCompany = (value: string) => {
    if (value === "ALL") {
      setSelectedCompanies(["ALL"]);
    } else {
      setSelectedCompanies((prev) => {
        const filtered = prev.filter((c) => c !== "ALL");
        if (filtered.includes(value)) {
          return filtered.filter((c) => c !== value);
        }
        return [...filtered, value];
      });
    }
  };

  const isCompanySelected = (value: string) =>
    selectedCompanies.includes(value);

  const companiesForSubmit = selectedCompanies.includes("ALL")
    ? ""
    : selectedCompanies.join(",");

  return (
    <PageWrapper title="Comunicados & Avisos">
      <div className="space-y-6 text-brand-terciar">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
            Comunicados & Avisos
          </h1>
          <p className="text-xs text-brand-terciar/70 mt-1">
            Gerencie comunicados globais e direcionados para empresas
            específicas.
          </p>
        </div>

        {isAdminOrCoord && (
          <button
            onClick={handleNew}
            className="flex items-center justify-center gap-1.5 self-start sm:self-center px-4 py-2 bg-brand-extra2 text-white font-bold rounded-lg text-xs hover:bg-brand-extra2/90 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Comunicado
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 py-2 border-y border-brand-terciar/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-terciar/50" />
          <input
            type="text"
            placeholder="Buscar comunicado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-brand-terciar/10 rounded-xl text-xs text-brand-terciar placeholder-brand-terciar/40 focus:outline-none focus:border-brand-secundar transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none w-full sm:w-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "ALL"
                ? "bg-brand-secundar text-white border-brand-secundar shadow-sm"
                : "bg-white border-brand-terciar/10 text-brand-terciar/60 hover:text-brand-secundar hover:bg-brand-principal/20"
            }`}
          >
            Todos
          </button>
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === opt.value
                  ? "bg-brand-secundar text-white border-brand-secundar shadow-sm"
                  : "bg-white border-brand-terciar/10 text-brand-terciar/60 hover:text-brand-secundar hover:bg-brand-principal/20"
              }`}
            >
              <opt.icon className="w-3.5 h-3.5 inline-block mr-1" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
                <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  {editingAnn ? "Editar Comunicado" : "Novo Comunicado"}
                </h2>
                <button
                  onClick={() => setFormOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-brand-terciar/10 text-brand-terciar/50 hover:text-brand-terciar transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit(handleSubmitForm)}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {message && (
                  <div
                    className={`p-3 rounded-lg text-xs border ${
                      message.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold"
                        : "border-red-200 bg-red-50 text-red-800"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Título *
                    </label>
                    <input
                      {...register("title")}
                      placeholder="Ex: Manutenção programada, Nova política, Resultado trimestral"
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                    />
                    {errors.title && (
                      <p className="text-[10px] text-red-600">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Conteúdo *
                    </label>
                    <textarea
                      {...register("content")}
                      rows={4}
                      placeholder="Descreva o comunicado detalhadamente..."
                      className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors resize-none"
                    />
                    {errors.content && (
                      <p className="text-[10px] text-red-600">
                        {errors.content.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                        Prioridade
                      </label>
                      <select
                        {...register("priority")}
                        className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                      >
                        {priorityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                        Expiração (opcional)
                      </label>
                      <input
                        {...register("expiresAt")}
                        type="date"
                        className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
                      />
                      <p className="text-[9px] text-brand-terciar/50">
                        Vazio = não expira
                      </p>
                    </div>
                  </div>

                  {/* Company Selector - Custom Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">
                      Empresas destinatárias *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar flex items-center justify-between focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 flex-wrap">
                          {selectedCompanies.length === 0 ? (
                            <span className="text-brand-terciar/45">
                              Selecione as empresas
                            </span>
                          ) : selectedCompanies.includes("ALL") ? (
                            <span className="font-medium text-brand-extra1">
                              Todas as empresas
                            </span>
                          ) : (
                            <>
                              {selectedCompanies.slice(0, 2).map((c) => (
                                <span
                                  key={c}
                                  className={`px-2 py-0.5 rounded text-[9px] font-medium border ${
                                    companyColors[c] ||
                                    "text-brand-terciar bg-brand-principal/20 border-brand-terciar/20"
                                  }`}
                                >
                                  {getCompanyLabel(c)}
                                </span>
                              ))}
                              {selectedCompanies.length > 2 && (
                                <span className="text-brand-terciar/60 text-[9px]">
                                  +{selectedCompanies.length - 2} mais
                                </span>
                              )}
                            </>
                          )}
                        </span>
                        {dropdownOpen ? (
                          <ChevronUp className="w-4 h-4 text-brand-terciar/60" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-brand-terciar/60" />
                        )}
                      </button>

                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white border border-brand-terciar/15 rounded-lg shadow-lg"
                        >
                          {companyOptions.map((opt) => (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-brand-principal/30 transition-colors ${
                                isCompanySelected(opt.value)
                                  ? "bg-brand-principal/50"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isCompanySelected(opt.value)}
                                onChange={() => toggleCompany(opt.value)}
                                className="w-4 h-4 text-brand-secundar border-brand-terciar/20 rounded focus:ring-brand-secundar"
                              />
                              <span className="text-xs text-brand-terciar">
                                {opt.label}
                              </span>
                              {isCompanySelected(opt.value) && (
                                <Check className="w-3.5 h-3.5 text-brand-secundar ml-auto" />
                              )}
                            </label>
                          ))}
                        </motion.div>
                      )}
                    </div>
                    <p className="text-[9px] text-brand-terciar/50">
                      Selecione &quot;Todas as empresas&quot; ou escolha individualmente
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-brand-terciar/10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        {...register("isPinned")}
                        type="checkbox"
                        className="w-4 h-4 text-brand-secundar border-brand-terciar/20 rounded focus:ring-brand-secundar"
                      />
                      <span className="text-xs text-brand-terciar/80 flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5" />
                        Fixado no topo
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        {...register("isActive")}
                        type="checkbox"
                        className="w-4 h-4 text-brand-secundar border-brand-terciar/20 rounded focus:ring-brand-secundar"
                      />
                      <span className="text-xs text-brand-terciar/80">
                        Ativo (visível)
                      </span>
                    </label>
                  </div>
                </div>

                <input
                  type="hidden"
                  {...register("targetCompanies")}
                  value={companiesForSubmit}
                />

                <div className="flex justify-end gap-2 pt-4 border-t border-brand-terciar/10">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="px-4 py-2 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar/70 hover:text-brand-extra1 hover:bg-brand-principal/50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
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
                        {editingAnn ? "Atualizar" : "Criar"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-white animate-pulse rounded-xl border border-brand-terciar/10"
            />
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-brand-terciar/20 bg-white rounded-2xl shadow-sm">
          <Bell className="w-12 h-12 text-brand-terciar/20 mx-auto mb-3" />
          <p className="text-sm text-brand-terciar/50">
            {search || activeFilter !== "ALL"
              ? "Nenhum comunicado encontrado com os filtros aplicados."
              : 'Nenhum comunicado cadastrado. Clique em "Novo Comunicado" para começar.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((ann) => (
            <motion.div
              key={ann.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border bg-white transition-all ${
                ann.isPinned
                  ? "border-amber-200 bg-amber-50 shadow-sm"
                  : "border-brand-terciar/10 hover:border-brand-secundar hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(ann.priority)}`}
                    >
                      {getPriorityIcon(ann.priority)}
                      {getPriorityLabel(ann.priority)}
                    </span>
                    {ann.isPinned && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800 flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5" />
                        Fixado
                      </span>
                    )}
                    {!ann.read && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-brand-secundar/20 bg-brand-secundar/10 text-brand-secundar">
                        Novo
                      </span>
                    )}
                    {!ann.isActive && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-200 bg-red-50 text-red-700">
                        Inativo
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-sm font-bold text-brand-extra1 ${!ann.read ? "" : "opacity-80"}`}
                  >
                    {ann.title}
                  </h3>
                  <p
                    className={`text-xs text-brand-terciar/70 mt-1 leading-relaxed ${!ann.read ? "font-medium" : ""}`}
                  >
                    {ann.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-brand-terciar/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ann.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    {ann.expiresAt && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Calendar className="w-3 h-3" />
                        Expira:{" "}
                        {new Date(ann.expiresAt).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Building2 className="w-3 h-3" />
                      {getTargetCompaniesDisplay(ann.targetCompanies).map(
                        (c, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                              companyColors[
                                c.toUpperCase().replace(" ", "_")
                              ] ||
                              "text-brand-terciar bg-brand-principal/20 border-brand-terciar/20"
                            }`}
                          >
                            {c}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!ann.read && (
                    <button
                      onClick={() => handleMarkRead(ann.id)}
                      className="p-1.5 rounded-lg border border-brand-terciar/15 bg-brand-principal/20 text-brand-secundar hover:text-brand-secundar/80 hover:bg-brand-principal/60 cursor-pointer"
                      title="Marcar como lido"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {isAdminOrCoord && (
                    <button
                      onClick={() => handleEdit(ann)}
                      className="p-1.5 rounded-lg border border-brand-terciar/15 bg-brand-principal/20 text-brand-secundar hover:text-brand-secundar/80 hover:bg-brand-principal/60 cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(ann.id, ann.title)}
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
    </PageWrapper>
  );
}
