"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ListTodo,
  RefreshCw,
  Search,
  User,
  Tag,
  ExternalLink,
  Layers,
  Building2,
  Wine,
  GraduationCap,
  TrendingUp,
  BarChart3,
  Globe,
} from "lucide-react";

import PortalMetricsView from "@/components/portal-metrics-view";

interface ClickUpTaskItem {
  id: string;
  name: string;
  classification: "done" | "approved" | "late" | "scheduled" | "pending";
  statusName: string;
  statusType: string;
  dueDate: number | null;
  url: string;
  listName: string;
  assignees: { id: string; name: string; color: string }[];
  tags: { name: string; bg: string; fg: string }[];
}

interface PersonGroup {
  id: string;
  name: string;
  color: string;
  tasks: ClickUpTaskItem[];
}

interface TagGroup {
  name: string;
  bg: string;
  fg: string;
  tasks: ClickUpTaskItem[];
}

interface ClickUpData {
  team: { id: string; name: string };
  summary: {
    total: number;
    done: number;
    approved: number;
    late: number;
    scheduled: number;
    pending: number;
  };
  tasks: ClickUpTaskItem[];
  groups: {
    byPerson: PersonGroup[];
    byTag: TagGroup[];
  };
  updatedAt: string;
}

interface CompanyMetricItem {
  company: string;
  isActive: boolean;
  label?: string;
  value: string | number;
  period?: string;
}

const STATUS_CONFIG = {
  all: { label: "Todas" },
  done: { label: "Concluídas", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: CheckCircle2 },
  approved: { label: "Aprovadas", cls: "bg-sky-500/10 text-sky-700 border-sky-500/20", icon: CheckCircle2 },
  late: { label: "Atrasadas", cls: "bg-red-500/10 text-red-700 border-red-500/20", icon: AlertCircle },
  scheduled: { label: "Programadas", cls: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: Calendar },
  pending: { label: "Pendentes", cls: "bg-gray-500/10 text-gray-700 border-gray-500/20", icon: Clock },
};

function formatDate(ms: number | null): string {
  if (!ms) return "Sem prazo";
  const d = new Date(ms);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function MetricasUnificadasPage() {
  const [activeTab, setActiveTab] = useState<"trafego" | "clickup">("trafego");

  // State ClickUp
  const [data, setData] = useState<ClickUpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"person" | "tag">("person");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [railSearch, setRailSearch] = useState("");
  const [pollInterval, setPollInterval] = useState<number>(20000);

  const fetchMetrics = useCallback(async (isInitial = false, isForce = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const url = isForce ? "/api/clickup?force=true" : "/api/clickup";
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao obter dados do ClickUp");
      }
      const json: ClickUpData = await res.json();
      setData(json);

      if (json.groups) {
        if (viewMode === "person" && json.groups.byPerson.length > 0 && !selectedKey) {
          setSelectedKey(json.groups.byPerson[0].id);
        } else if (viewMode === "tag" && json.groups.byTag.length > 0 && !selectedKey) {
          setSelectedKey(json.groups.byTag[0].name);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro desconhecido ao carregar métricas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedKey, viewMode]);

  useEffect(() => {
    fetchMetrics(true);
  }, [fetchMetrics]);

  useEffect(() => {
    if (pollInterval <= 0) return;
    const timer = setInterval(() => {
      fetchMetrics(false);
    }, pollInterval);
    return () => clearInterval(timer);
  }, [pollInterval, fetchMetrics]);

  const handleModeChange = (mode: "person" | "tag") => {
    setViewMode(mode);
    setSelectedKey(null);
  };

  const filteredPersonList = data?.groups.byPerson.filter((p) =>
    p.name.toLowerCase().includes(railSearch.toLowerCase())
  ) || [];

  const filteredTagList = data?.groups.byTag.filter((t) =>
    t.name.toLowerCase().includes(railSearch.toLowerCase())
  ) || [];

  const currentPerson = viewMode === "person"
    ? (filteredPersonList.find((p) => p.id === selectedKey) || filteredPersonList[0])
    : null;

  const currentTag = viewMode === "tag"
    ? (filteredTagList.find((t) => t.name === selectedKey) || filteredTagList[0])
    : null;

  const currentGroupTasks = viewMode === "person" ? currentPerson?.tasks : currentTag?.tasks;
  const currentTitle = viewMode === "person" ? currentPerson?.name : currentTag?.name;

  const displayTasks = (currentGroupTasks || []).filter((t) => {
    if (statusFilter === "all") return true;
    return t.classification === statusFilter;
  });

  return (
    <div className="space-y-6 text-brand-terciar pb-12">
      {/* Header & Sub-Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-terciar/10">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-secundar" />
            <h1 className="text-xl font-bold tracking-tight text-brand-extra1 sm:text-2xl">
              Central de Métricas
            </h1>
          </div>
          <p className="text-xs text-brand-terciar/70 mt-1">
            Visualização consolidada de indicadores operacionais e tarefas delegadas do Grupo Azul.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-brand-principal border border-brand-terciar/10 self-start sm:self-center flex-wrap">
          <button
            onClick={() => setActiveTab("trafego")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all transform-gpu ${
              activeTab === "trafego"
                ? "bg-white text-brand-secundar shadow-sm"
                : "text-brand-terciar/70 hover:text-brand-extra1"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Tráfego &amp; Instagram (Portal CP)
          </button>
          <button
            onClick={() => setActiveTab("clickup")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all transform-gpu ${
              activeTab === "clickup"
                ? "bg-white text-brand-secundar shadow-sm"
                : "text-brand-terciar/70 hover:text-brand-extra1"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            ClickUp (Tarefas)
          </button>
        </div>
      </div>

      {/* TAB TRÁFEGO & INSTAGRAM (PORTAL CP) */}
      {activeTab === "trafego" && <PortalMetricsView />}

      {/* TAB 1: CLICKUP DELEGAÇÃO */}
      {activeTab === "clickup" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-brand-terciar/10 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-secundar animate-pulse" />
              <span className="text-xs font-bold text-brand-extra1">
                {data?.team ? `Workspace ClickUp: ${data.team.name}` : "Conectando ao ClickUp..."}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {data?.updatedAt && (
                <span className="text-[11px] font-mono text-brand-terciar/60">
                  Atualizado: {new Date(data.updatedAt).toLocaleTimeString("pt-BR")}
                </span>
              )}

              <select
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-brand-terciar/20 bg-white text-brand-terciar outline-none cursor-pointer focus:border-brand-secundar"
              >
                <option value={30000}>30s</option>
                <option value={60000}>1 min</option>
                <option value={300000}>5 min</option>
                <option value={0}>Manual</option>
              </select>

              <button
                onClick={() => fetchMetrics(false, true)}
                disabled={refreshing || loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-terciar/20 bg-white hover:bg-brand-principal text-brand-extra1 transition-colors disabled:opacity-50 transform-gpu"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brand-secundar" : ""}`} />
                Atualizar
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-800 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-brand-terciar/10 bg-white shadow-sm">
              <div className="flex justify-between items-center text-brand-terciar/60">
                <span className="text-[10px] font-mono uppercase tracking-wider">Total</span>
                <ListTodo className="w-3.5 h-3.5 text-brand-terciar" />
              </div>
              <p className="text-2xl font-bold text-brand-extra1 mt-1 font-mono">{loading ? "..." : data?.summary.total || 0}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 shadow-sm">
              <div className="flex justify-between items-center text-emerald-700/70">
                <span className="text-[10px] font-mono uppercase tracking-wider">Concluídas</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono">{loading ? "..." : data?.summary.done || 0}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="p-4 rounded-xl border border-sky-500/20 bg-sky-50/50 shadow-sm">
              <div className="flex justify-between items-center text-sky-700/70">
                <span className="text-[10px] font-mono uppercase tracking-wider">Aprovadas</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <p className="text-2xl font-bold text-sky-700 mt-1 font-mono">{loading ? "..." : data?.summary.approved || 0}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="p-4 rounded-xl border border-red-500/20 bg-red-50/50 shadow-sm">
              <div className="flex justify-between items-center text-red-700/70">
                <span className="text-[10px] font-mono uppercase tracking-wider">Atrasadas</span>
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-700 mt-1 font-mono">{loading ? "..." : data?.summary.late || 0}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/50 shadow-sm">
              <div className="flex justify-between items-center text-amber-700/70">
                <span className="text-[10px] font-mono uppercase tracking-wider">Programadas</span>
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">{loading ? "..." : data?.summary.scheduled || 0}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-4 rounded-xl border border-gray-500/20 bg-gray-50/50 shadow-sm">
              <div className="flex justify-between items-center text-gray-700/70">
                <span className="text-[10px] font-mono uppercase tracking-wider">Pendentes</span>
                <Clock className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-700 mt-1 font-mono">{loading ? "..." : data?.summary.pending || 0}</p>
            </motion.div>
          </div>

          {/* Main Mobile First Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Rail Selector */}
            <div className="md:col-span-4 lg:col-span-3 p-4 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-brand-principal border border-brand-terciar/10 text-xs">
                <button
                  onClick={() => handleModeChange("person")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all ${
                    viewMode === "person" ? "bg-white text-brand-secundar shadow-sm" : "text-brand-terciar/70 hover:text-brand-extra1"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Por pessoa
                </button>
                <button
                  onClick={() => handleModeChange("tag")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all ${
                    viewMode === "tag" ? "bg-white text-brand-secundar shadow-sm" : "text-brand-terciar/70 hover:text-brand-extra1"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Por etiqueta
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-brand-terciar/40" />
                <input
                  type="text"
                  placeholder="Filtrar lista..."
                  value={railSearch}
                  onChange={(e) => setRailSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-brand-terciar/15 bg-brand-principal/30 text-brand-extra1 placeholder-brand-terciar/40 outline-none focus:border-brand-secundar"
                />
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1">
                {loading ? (
                  <div className="space-y-2 py-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 bg-brand-principal animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : viewMode === "person" ? (
                  filteredPersonList.length === 0 ? (
                    <p className="text-xs text-brand-terciar/50 py-4 text-center">Nenhuma pessoa encontrada.</p>
                  ) : (
                    filteredPersonList.map((p) => {
                      const isSelected = (selectedKey || filteredPersonList[0]?.id) === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedKey(p.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left transform-gpu ${
                            isSelected
                              ? "border-brand-secundar/40 bg-brand-secundar/5 text-brand-secundar font-bold shadow-sm"
                              : "border-transparent hover:bg-brand-principal/50 text-brand-terciar"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ backgroundColor: p.color || "#105D8F" }}
                            >
                              {getInitials(p.name)}
                            </div>
                            <span className="text-xs truncate">{p.name}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-terciar/10 text-brand-terciar shrink-0">
                            {p.tasks.length}
                          </span>
                        </button>
                      );
                    })
                  )
                ) : filteredTagList.length === 0 ? (
                  <p className="text-xs text-brand-terciar/50 py-4 text-center">Nenhuma etiqueta encontrada.</p>
                ) : (
                  filteredTagList.map((t) => {
                    const isSelected = (selectedKey || filteredTagList[0]?.name) === t.name;
                    return (
                      <button
                        key={t.name}
                        onClick={() => setSelectedKey(t.name)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left transform-gpu ${
                          isSelected
                            ? "border-brand-secundar/40 bg-brand-secundar/5 text-brand-secundar font-bold shadow-sm"
                            : "border-transparent hover:bg-brand-principal/50 text-brand-terciar"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: t.bg }} />
                          <span className="text-xs truncate">{t.name}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-terciar/10 text-brand-terciar shrink-0">
                          {t.tasks.length}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Task List Table */}
            <div className="md:col-span-8 lg:col-span-9 p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-brand-extra1">
                    {currentTitle || "Selecione um item"}
                  </h2>
                  <p className="text-xs text-brand-terciar/60">
                    {displayTasks.length} de {(currentGroupTasks || []).length} tarefas exibidas
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const isActive = statusFilter === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all transform-gpu ${
                          isActive
                            ? "bg-brand-secundar text-white border-brand-secundar shadow-sm"
                            : "bg-brand-principal/40 text-brand-terciar/70 border-brand-terciar/15 hover:bg-brand-principal hover:text-brand-extra1"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3, 5].map((i) => (
                    <div key={i} className="h-12 bg-brand-principal animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : displayTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-brand-terciar/60 bg-brand-principal/20 rounded-xl border border-dashed border-brand-terciar/15">
                  Nenhuma tarefa encontrada para este filtro.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-terciar/10 text-[10px] uppercase font-mono text-brand-terciar/60">
                        <th className="pb-3 font-semibold">Tarefa</th>
                        <th className="pb-3 font-semibold">Etiquetas</th>
                        <th className="pb-3 font-semibold">Responsável</th>
                        <th className="pb-3 font-semibold">Prazo</th>
                        <th className="pb-3 font-semibold text-right">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-terciar/10">
                      {displayTasks.map((t) => {
                        const statusMeta = STATUS_CONFIG[t.classification];
                        return (
                          <tr key={t.id} className="hover:bg-brand-principal/30 transition-colors">
                            <td className="py-3 pr-3">
                              <a
                                href={t.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-brand-extra1 hover:text-brand-secundar inline-flex items-center gap-1 group"
                              >
                                <span>{t.name}</span>
                                <ExternalLink className="w-3 h-3 text-brand-terciar/40 group-hover:text-brand-secundar transition-colors" />
                              </a>
                              {t.listName && (
                                <p className="text-[10px] text-brand-terciar/50 flex items-center gap-1 mt-0.5">
                                  <Layers className="w-2.5 h-2.5" />
                                  {t.listName}
                                </p>
                              )}
                            </td>

                            <td className="py-3 pr-3">
                              <div className="flex flex-wrap gap-1">
                                {t.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: tag.bg, color: tag.fg }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td className="py-3 pr-3">
                              <span className="text-xs text-brand-terciar font-medium">
                                {t.assignees.map((a) => a.name).join(", ")}
                              </span>
                            </td>

                            <td className="py-3 pr-3 font-mono text-[11px] text-brand-terciar/70">
                              {formatDate(t.dueDate)}
                            </td>

                            <td className="py-3 text-right">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusMeta.cls}`}>
                                {statusMeta.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
