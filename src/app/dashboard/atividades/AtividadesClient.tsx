"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageWrapper } from "@/components/PageWrapper";
import {
  Search,
  Activity,
  User,
  Calendar,

  ChevronRight,
  Filter,
  RefreshCw,
  Building,
  Key,
  Shield,
  FileText,
  Trash2,
  Edit,
  PlusCircle,
} from "lucide-react";

interface LogItem {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userImage?: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface AtividadesClientProps {
  userId: string;
  userLevel: number;
  userCompany?: string;
}

const actionOptions = [
  { value: "", label: "Todas as Ações" },
  { value: "LOGIN", label: "Login", icon: Key },
  { value: "LOGOUT", label: "Logout", icon: Key },
  { value: "ACESSO_PAINEL", label: "Acesso a Painel", icon: Shield },
  { value: "CRIAR_ANUNCIO", label: "Criar Anúncio", icon: PlusCircle },
  { value: "ATUALIZAR_ANUNCIO", label: "Atualizar Anúncio", icon: Edit },
  { value: "DELETAR_ANUNCIO", label: "Deletar Anúncio", icon: Trash2 },
  { value: "CRIAR_DOCUMENTO", label: "Criar Documento", icon: FileText },
  { value: "DELETAR_DOCUMENTO", label: "Deletar Documento", icon: Trash2 },
  { value: "CRIAR_UNIDADE", label: "Criar Unidade", icon: Building },
  { value: "ATUALIZAR_UNIDADE", label: "Atualizar Unidade", icon: Edit },
  { value: "DELETAR_UNIDADE", label: "Deletar Unidade", icon: Trash2 },
  { value: "ALTERAR_HIERARQUIA", label: "Alterar Hierarquia", icon: Shield },
];

export default function AtividadesClient({
  userLevel,
}: AtividadesClientProps) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async (currentPage: number, append = false) => {
    if (currentPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "15",
        search,
        action,
      });

      const res = await fetch(`/api/activities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setLogs((prev) => [...prev, ...data.items]);
        } else {
          setLogs(data.items);
        }
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [search, action]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLogs(1, false);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [fetchLogs]);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchLogs(page + 1, true);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs(1, false);
  };

  const getActionIcon = (act: string) => {
    if (act.includes("CRIAR")) return PlusCircle;
    if (act.includes("DELETAR")) return Trash2;
    if (act.includes("ATUALIZAR") || act.includes("ALTERAR")) return Edit;
    if (act.includes("LOGIN") || act.includes("LOGOUT")) return Key;
    if (act.includes("ACESSO")) return Shield;
    if (act.includes("DOCUMENTO")) return FileText;
    return Activity;
  };

  const getActionColor = (act: string) => {
    if (act.includes("CRIAR")) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (act.includes("DELETAR")) return "text-rose-600 bg-rose-50 border-rose-200";
    if (act.includes("ATUALIZAR") || act.includes("ALTERAR")) return "text-amber-600 bg-amber-50 border-amber-200";
    if (act.includes("LOGIN")) return "text-indigo-600 bg-indigo-50 border-indigo-200";
    if (act.includes("ACESSO")) return "text-sky-600 bg-sky-50 border-sky-200";
    return "text-brand-terciar bg-brand-principal border-brand-terciar/15";
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-brand-extra1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-secundar" />
              Linha do Tempo de Atividades
            </h1>
            <p className="text-xs text-brand-terciar/70">
              Acompanhe todas as ações executadas no sistema em tempo real.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-brand-terciar/15 hover:border-brand-secundar text-brand-terciar hover:text-brand-secundar rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar Feed
          </button>
        </div>

        {/* Filters Bento Box */}
        <div className="p-4 bg-white rounded-2xl border border-brand-terciar/10 shadow-sm space-y-4">
          <h3 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-brand-terciar" />
            Filtros do Feed
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-brand-terciar/40" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar detalhes..."
                className="w-full pl-9 pr-4 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
              />
            </div>

            {/* Action Select */}
            <div className="relative">
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors cursor-pointer"
              >
                {actionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats Badge */}
            <div className="flex items-center justify-end px-1">
              <span className="text-[10px] font-mono text-brand-terciar/60">
                Mostrando {logs.length} de {total} atividades
              </span>
            </div>
          </div>
        </div>

        {/* Activity Feed Timeline */}
        <div className="relative border-l border-brand-terciar/15 ml-4 pl-6 space-y-6">
          {loading ? (
            // Skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative animate-pulse space-y-2">
                <div className="absolute left-[-31px] w-4 h-4 rounded-full bg-brand-terciar/10 border-2 border-white" />
                <div className="h-4 bg-brand-terciar/10 rounded w-1/4" />
                <div className="h-12 bg-brand-terciar/10 rounded-xl w-full" />
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="py-12 text-center bg-white border border-brand-terciar/10 rounded-2xl p-6">
              <Activity className="w-8 h-8 text-brand-terciar/30 mx-auto mb-2" />
              <p className="text-xs text-brand-terciar/60">Nenhuma atividade registrada.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {logs.map((item) => {
                const Icon = getActionIcon(item.action);
                const colorClass = getActionColor(item.action);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, ease: "linear" }}
                    className="relative group"
                  >
                    {/* Circle Indicator on line */}
                    <div className={`absolute left-[-32px] top-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white transition-all duration-200 ${
                      item.action.includes("DELETAR")
                        ? "bg-rose-500 text-white"
                        : item.action.includes("CRIAR")
                          ? "bg-emerald-500 text-white"
                          : "bg-brand-secundar text-white"
                    }`}>
                      <Icon className="w-2.5 h-2.5" />
                    </div>

                    {/* Timeline card */}
                    <div className="p-4 bg-white border border-brand-terciar/10 hover:border-brand-secundar/30 rounded-2xl shadow-sm transition-all duration-200 space-y-3 transform-gpu">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        {/* User and Action Badge */}
                        <div className="flex items-center gap-2">
                          {item.userImage ? (
                            <img
                              src={item.userImage}
                              alt={item.userName}
                              className="w-5 h-5 rounded-full object-cover border border-brand-terciar/10"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-brand-principal border border-brand-terciar/10 flex items-center justify-center">
                              <User className="w-3 h-3 text-brand-secundar" />
                            </div>
                          )}
                          <span className="text-xs font-bold text-brand-extra1">
                            {item.userName}
                          </span>
                          <span className="text-[9px] text-brand-terciar/50">
                            ({item.userEmail})
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wide ${colorClass}`}>
                            {item.action.replace("_", " ")}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-[10px] text-brand-terciar/50 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-brand-terciar/40" />
                          {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </div>
                      </div>

                      {/* Log details */}
                      <p className="text-xs text-brand-terciar leading-relaxed">
                        {item.details}
                      </p>

                      {/* Technical Meta (Only visible to Level 1 and 2) */}
                      {userLevel <= 2 && (
                        <div className="flex items-center gap-3 pt-2 border-t border-brand-terciar/5 text-[9px] text-brand-terciar/40 font-mono">
                          <span>IP: {item.ipAddress || "Interno"}</span>
                          <span className="truncate max-w-xs sm:max-w-md">
                            Browser: {item.userAgent}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {/* Load More Button */}
          {page < totalPages && (
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-principal hover:bg-brand-principal/80 text-brand-secundar rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    Carregar Mais Atividades
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
