"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Eye,
  MousePointer,
  MessageSquare,
  ShoppingBag,
  Calendar,
  RefreshCw,
  ExternalLink,
  Layers,
  Wine,
  Building2,
  X,
  ChevronRight,
  Sparkles,
  Award,
  BarChart2,
  Smartphone,
  Tag,
  ArrowUpRight,
  FileDown,
} from "lucide-react";
import {
  PortalConta,
  PortalReportData,
  PortalOrganicoData,
} from "@/lib/portal-api";
import { getCurrentInstagramReportMonth, type InstagramReportData } from "@/lib/instagram-report";
import { renderInstagramReportHtml } from "@/lib/instagram-report-print";

interface PortalMetricsViewProps {
  initialContaId?: string;
}

const formatNumber = (val: number, decimals: number = 0): string => {
  return (Number(val) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatCurrency = (val: number, decimals: number = 0): string => {
  return "R$ " + formatNumber(val, decimals);
};

const formatPercent = (val: number): string => {
  return formatNumber(val, 2) + "%";
};

function getDefaultInstagramReportMonths(): { from: string; to: string } {
  const now = new Date();
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  now.setDate(1);
  now.setMonth(now.getMonth() - 3);
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return { from, to };
}

const isMetaCdnUrl = (src: string): boolean => {
  try {
    const hostname = new URL(src, "https://centralazul.invalid").hostname.toLowerCase();
    return ["cdninstagram.com", "fbcdn.net", "fbsbx.com"].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
};

function PortalMediaImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const message = isMetaCdnUrl(src)
      ? "Imagem hospedada no CDN da Meta indisponível"
      : "Imagem indisponível";

    return (
      <div
        role="img"
        aria-label={`${alt}. ${message}`}
        className="flex h-full w-full items-center justify-center p-3 text-center text-[10px] font-medium text-brand-terciar/70"
      >
        {message}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export default function PortalMetricsView({ initialContaId }: PortalMetricsViewProps) {
  const [contas, setContas] = useState<PortalConta[]>([]);
  const [selectedConta, setSelectedConta] = useState<string>(initialContaId || "");
  const [period, setPeriod] = useState<string>("mes");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [report, setReport] = useState<PortalReportData | null>(null);
  const [organico, setOrganico] = useState<PortalOrganicoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingOrganico, setLoadingOrganico] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal de preview de anuncio
  const [previewAdId, setPreviewAdId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [reportMonths, setReportMonths] = useState(getDefaultInstagramReportMonths);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const generateInstagramReport = async () => {
    setReportError(null);
    if (!reportMonths.from || !reportMonths.to || reportMonths.from > reportMonths.to) {
      setReportError("Selecione um intervalo de meses válido.");
      return;
    }

    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) {
      setReportError("O navegador bloqueou a nova janela. Permita pop-ups para gerar o relatório.");
      return;
    }

    setGeneratingReport(true);
    try {
      const params = new URLSearchParams({ from: reportMonths.from, to: reportMonths.to });
      const response = await fetch(`/api/portal/instagram-report?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível gerar o relatório.");

      const report = result as InstagramReportData;
      printWindow.document.open();
      printWindow.document.write(renderInstagramReportHtml(report));
      printWindow.document.close();
      printWindow.document.querySelectorAll<HTMLButtonElement>("[data-print]").forEach((button) => {
        button.addEventListener("click", () => printWindow.print());
      });
      window.setTimeout(() => {
        if (!printWindow.closed) printWindow.print();
      }, 500);
    } catch (error) {
      printWindow.close();
      setReportError(error instanceof Error ? error.message : "Não foi possível gerar o relatório.");
    } finally {
      setGeneratingReport(false);
    }
  };

  // Carrega lista de contas ao montar
  useEffect(() => {
    async function loadContas() {
      try {
        const res = await fetch("/api/portal?action=contas");
        if (res.ok) {
          const data = await res.json();
          const list: PortalConta[] = data.contas || [];
          setContas(list);
          if (list.length > 0 && !selectedConta) {
            setSelectedConta(list[0].id);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar contas do portal:", err);
      }
    }
    loadContas();
  }, [selectedConta]);

  const [autoPollInterval, setAutoPollInterval] = useState<number>(20000);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Carrega relatorio da conta selecionada
  const loadReportData = useCallback(async (isRefresh = false) => {
    if (!selectedConta) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let query = `/api/portal?action=report&conta=${encodeURIComponent(selectedConta)}&period=${encodeURIComponent(period)}`;
      if (period === "custom" && fromDate && toDate) {
        query += `&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
      }

      const res = await fetch(query);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao obter relatório de performance");
      }

      const data: PortalReportData = await res.json();
      setReport(data);
      const sourceSyncTime = data.synced_at ? new Date(data.synced_at) : new Date();
      setLastSyncedAt(Number.isNaN(sourceSyncTime.getTime()) ? new Date() : sourceSyncTime);

      // Carrega organico em seguida
      loadOrganicoData(selectedConta, period, fromDate, toDate);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de conexão com o portal");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedConta, period, fromDate, toDate]);

  // Polling em tempo real continuo sem precisar dar F5
  useEffect(() => {
    if (autoPollInterval <= 0 || !selectedConta) return;
    const timer = setInterval(() => {
      loadReportData(true);
    }, autoPollInterval);
    return () => clearInterval(timer);
  }, [autoPollInterval, selectedConta, loadReportData]);

  const loadOrganicoData = async (cId: string, per: string, from?: string, to?: string) => {
    setLoadingOrganico(true);
    try {
      let query = `/api/portal?action=organico&conta=${encodeURIComponent(cId)}&period=${encodeURIComponent(per)}`;
      if (per === "custom" && from && to) {
        query += `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      }
      const res = await fetch(query);
      if (res.ok) {
        const data: PortalOrganicoData = await res.json();
        setOrganico(data);
      }
    } catch (e) {
      console.error("Erro ao carregar orgânico:", e);
    } finally {
      setLoadingOrganico(false);
    }
  };

  useEffect(() => {
    if (selectedConta) {
      loadReportData();
    }
  }, [selectedConta, period, loadReportData]);

  // Carrega preview do anuncio
  const openAdPreview = async (adId: string) => {
    setPreviewAdId(adId);
    setLoadingPreview(true);
    setPreviewHtml(null);
    try {
      const res = await fetch(`/api/portal?action=preview&conta=${encodeURIComponent(selectedConta)}&ad_id=${encodeURIComponent(adId)}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewHtml(data.html || "<div class='p-4 text-center text-xs text-gray-500'>Preview indisponivel no momento</div>");
      }
    } catch (e) {
      console.error("Erro ao carregar preview do anúncio:", e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const contaInfo = contas.find((c) => c.id === selectedConta);

  return (
    <div className="space-y-6 text-brand-terciar">
      {/* Selector & Controls Bar */}
      <div className="p-4 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          {/* Contas Dropdown */}
          <div className="relative flex-1 sm:w-64">
            <label className="block text-[10px] uppercase font-mono text-brand-terciar/60 mb-1">
              Unidade de Negócio / Conta
            </label>
            <select
              value={selectedConta}
              onChange={(e) => setSelectedConta(e.target.value)}
              className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-xl text-xs font-bold text-brand-extra1 focus:outline-none focus:border-brand-secundar transition-colors cursor-pointer"
            >
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.tipo})
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="relative flex-1 sm:w-48">
            <label className="block text-[10px] uppercase font-mono text-brand-terciar/60 mb-1">
              Período de Análise
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-brand-principal/30 border border-brand-terciar/15 rounded-xl text-xs font-semibold text-brand-terciar focus:outline-none focus:border-brand-secundar transition-colors cursor-pointer"
            >
              <option value="mes">Mês Atual</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="14d">Últimos 14 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="custom">Personalizado...</option>
            </select>
          </div>

          {/* Custom Date Range Inputs */}
          {period === "custom" && (
            <div className="flex items-center gap-2 pt-4 sm:pt-0">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1.5 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs font-mono text-brand-terciar outline-none focus:border-brand-secundar"
              />
              <span className="text-xs text-brand-terciar/50">até</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1.5 bg-brand-principal/30 border border-brand-terciar/15 rounded-lg text-xs font-mono text-brand-terciar outline-none focus:border-brand-secundar"
              />
              <button
                onClick={() => loadReportData()}
                className="px-3 py-1.5 bg-brand-secundar text-white text-xs font-bold rounded-lg hover:bg-brand-secundar/90 transition-colors shadow-sm"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>

        {/* Live Refresh & Auto-Sync Controls */}
        <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Tempo Real</span>
          </div>

          {lastSyncedAt && (
            <span className="text-[10px] font-mono text-brand-terciar/60 hidden lg:inline-block">
              Dados do portal: {lastSyncedAt.toLocaleTimeString("pt-BR")}
            </span>
          )}

          <select
            value={autoPollInterval}
            onChange={(e) => setAutoPollInterval(Number(e.target.value))}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-brand-terciar/15 bg-white text-brand-terciar outline-none cursor-pointer focus:border-brand-secundar"
          >
            <option value={15000}>15s (Ultra)</option>
            <option value={20000}>20s (Recomendado)</option>
            <option value={30000}>30s</option>
            <option value={60000}>1 min</option>
            <option value={0}>Manual</option>
          </select>

          <button
            onClick={() => loadReportData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-principal/50 hover:bg-brand-principal border border-brand-terciar/15 rounded-xl text-xs font-semibold text-brand-extra1 transition-colors transform-gpu disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brand-secundar" : ""}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-brand-terciar/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-brand-terciar" aria-labelledby="instagram-report-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="instagram-report-title" className="flex items-center gap-2 text-sm font-bold text-brand-extra1 dark:text-brand-principal">
              <FileDown className="h-4 w-4 text-brand-secundar" aria-hidden="true" />
              Relatório de publicações do Instagram
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-brand-terciar/70 dark:text-brand-principal/70">
              Gera contagens mensais por perfil e os três posts com mais curtidas. As visualizações individuais não são fornecidas pelo portal.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="text-[10px] font-mono uppercase text-brand-terciar/60">
              De
              <input
                type="month"
                value={reportMonths.from}
                max={reportMonths.to}
                onChange={(event) => setReportMonths((current) => ({ ...current, from: event.target.value }))}
                className="mt-1 block w-full rounded-lg border border-brand-terciar/15 bg-brand-principal/30 px-2.5 py-2 text-xs font-semibold text-brand-terciar outline-none focus:border-brand-secundar dark:border-white/15 dark:bg-white/5 dark:text-brand-principal"
                aria-label="Mês inicial do relatório"
              />
            </label>
            <label className="text-[10px] font-mono uppercase text-brand-terciar/60">
              Até
              <input
                type="month"
                value={reportMonths.to}
                min={reportMonths.from}
                max={getCurrentInstagramReportMonth()}
                onChange={(event) => setReportMonths((current) => ({ ...current, to: event.target.value }))}
                className="mt-1 block w-full rounded-lg border border-brand-terciar/15 bg-brand-principal/30 px-2.5 py-2 text-xs font-semibold text-brand-terciar outline-none focus:border-brand-secundar dark:border-white/15 dark:bg-white/5 dark:text-brand-principal"
                aria-label="Mês final do relatório"
              />
            </label>
            <button
              type="button"
              onClick={generateInstagramReport}
              disabled={generatingReport}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-secundar px-4 py-2.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-brand-secundar/90 disabled:cursor-wait disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" aria-hidden="true" />
              {generatingReport ? "Buscando publicações..." : "Gerar PDF"}
            </button>
          </div>
        </div>
        {reportError && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">{reportError}</p>}
      </section>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4 py-8">
          <div className="h-28 bg-white animate-pulse rounded-2xl border border-brand-terciar/10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white animate-pulse rounded-xl border border-brand-terciar/10" />
            ))}
          </div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Main Hero Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm relative overflow-hidden"
            >
              <div className="w-6 h-1 bg-brand-extra2 rounded-full mb-3" />
              <p className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60">
                Investimento Mídia
              </p>
              <p className="text-2xl font-bold text-brand-extra1 font-mono mt-1">
                {formatCurrency(report.media?.spend || 0)}
              </p>
              <p className="text-[11px] text-brand-terciar/60 mt-2">Verba aplicada na conta</p>
            </motion.div>

            {report.vendas?.faturamento ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm relative overflow-hidden"
              >
                <div className="w-6 h-1 bg-emerald-500 rounded-full mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60">
                  Faturamento
                </p>
                <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">
                  {formatCurrency(report.vendas.faturamento)}
                </p>
                <p className="text-[11px] text-brand-terciar/60 mt-2">Receita total no período</p>
              </motion.div>
            ) : report.media?.leads > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm relative overflow-hidden"
              >
                <div className="w-6 h-1 bg-sky-500 rounded-full mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60">
                  Cadastros / Leads
                </p>
                <p className="text-2xl font-bold text-sky-700 font-mono mt-1">
                  {formatNumber(report.media.leads)}
                </p>
                <p className="text-[11px] text-brand-terciar/60 mt-2">Interessados captados</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm relative overflow-hidden"
              >
                <div className="w-6 h-1 bg-brand-secundar rounded-full mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60">
                  Alcance Único
                </p>
                <p className="text-2xl font-bold text-brand-secundar font-mono mt-1">
                  {report.media?.reach ? formatNumber(report.media.reach) : "Indisponível"}
                </p>
                <p className="text-[11px] text-brand-terciar/60 mt-2">Pessoas impactadas</p>
              </motion.div>
            )}

            {report.vendas?.roas ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm relative overflow-hidden"
              >
                <div className="w-6 h-1 bg-amber-500 rounded-full mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60">
                  Retorno (ROAS)
                </p>
                <p className="text-2xl font-bold text-amber-700 font-mono mt-1">
                  {formatNumber(report.vendas.roas, 1)}x
                </p>
                <p className="text-[11px] text-brand-terciar/60 mt-2">Retorno sobre investimento</p>
              </motion.div>
            ) : report.media?.custo_lead > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm relative overflow-hidden"
              >
                <div className="w-6 h-1 bg-amber-500 rounded-full mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60">
                  Custo / Cadastro
                </p>
                <p className="text-2xl font-bold text-amber-700 font-mono mt-1">
                  {formatCurrency(report.media.custo_lead, 2)}
                </p>
                <p className="text-[11px] text-brand-terciar/60 mt-2">Por lead gerado</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm relative overflow-hidden"
              >
                <div className="w-6 h-1 bg-brand-terciar rounded-full mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60">
                  Impressões
                </p>
                <p className="text-2xl font-bold text-brand-extra1 font-mono mt-1">
                  {formatNumber(report.media?.impressions || 0)}
                </p>
                <p className="text-[11px] text-brand-terciar/60 mt-2">Exibições de anúncios</p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm relative overflow-hidden"
            >
              <div className="w-6 h-1 bg-brand-secundar rounded-full mb-3" />
              <p className="text-[10px] font-mono uppercase tracking-wider text-brand-terciar/60">
                CPM
              </p>
              <p className="text-2xl font-bold text-brand-extra1 font-mono mt-1">
                {formatCurrency(report.media?.cpm || 0, 2)}
              </p>
              <p className="text-[11px] text-brand-terciar/60 mt-2">Custo por mil exibições</p>
            </motion.div>
          </div>

          {report.verba && (
            <section
              aria-labelledby="portal-budget-heading"
              className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-brand-terciar/10">
                <h2 id="portal-budget-heading" className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-brand-secundar" />
                  Verba de mídia
                </h2>
                <span className="text-[10px] font-mono text-brand-terciar/50">
                  Informações sincronizadas pelo CP Portal
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                  { label: "Verba bruta", value: formatCurrency(report.verba.bruto) },
                  { label: "Verba líquida", value: formatCurrency(report.verba.liquido) },
                  { label: "Investido", value: formatCurrency(report.verba.gasto) },
                  { label: "Saldo restante", value: formatCurrency(report.verba.restante) },
                  { label: "Utilização", value: formatPercent(report.verba.pct) },
                  ...(report.verba.imposto != null
                    ? [{ label: "Imposto", value: formatCurrency(report.verba.imposto) }]
                    : []),
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-brand-principal/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-brand-terciar/60">{item.label}</p>
                    <p className="mt-1 text-sm font-bold font-mono text-brand-extra1">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Alcance & Entrega */}
          <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-terciar/10">
              <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-secundar" />
                Alcance & Entrega de Anúncios
              </h2>
              <span className="text-[10px] font-mono text-brand-terciar/50">Mídia Paga Meta Ads</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                <p className="text-[9px] uppercase font-mono text-brand-terciar/60">Impressões</p>
                <p className="text-lg font-bold text-brand-extra1 font-mono mt-0.5">
                  {formatNumber(report.media?.impressions || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                <p className="text-[9px] uppercase font-mono text-brand-terciar/60">Alcance Único</p>
                <p className="text-lg font-bold text-brand-extra1 font-mono mt-0.5">
                  {report.media?.reach ? formatNumber(report.media.reach) : "—"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                <p className="text-[9px] uppercase font-mono text-brand-terciar/60">Frequência</p>
                <p className="text-lg font-bold text-brand-extra1 font-mono mt-0.5">
                  {report.media?.frequency ? formatNumber(report.media.frequency, 1) : "—"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                <p className="text-[9px] uppercase font-mono text-brand-terciar/60">CPM</p>
                <p className="text-lg font-bold text-brand-extra1 font-mono mt-0.5">
                  {formatCurrency(report.media?.cpm || 0, 2)}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Interesse & Engajamento */}
          <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-terciar/10">
              <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-brand-secundar" />
                Interesse & Engajamento
              </h2>
              <span className="text-[10px] font-mono text-brand-terciar/50">Interações e Cliques</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                <p className="text-[9px] uppercase font-mono text-brand-terciar/60">Cliques</p>
                <p className="text-lg font-bold text-brand-extra1 font-mono mt-0.5">
                  {formatNumber(report.media?.clicks || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                <p className="text-[9px] uppercase font-mono text-brand-terciar/60">CTR (Taxa de clique)</p>
                <p className="text-lg font-bold text-brand-extra1 font-mono mt-0.5">
                  {formatPercent(report.media?.ctr || 0)}
                </p>
              </div>
              {report.media?.messages > 0 ? (
                <>
                  <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                    <p className="text-[9px] uppercase font-mono text-brand-terciar/60">Conversas WhatsApp</p>
                    <p className="text-lg font-bold text-brand-secundar font-mono mt-0.5">
                      {formatNumber(report.media.messages)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                    <p className="text-[9px] uppercase font-mono text-brand-terciar/60">Custo por conversa</p>
                    <p className="text-lg font-bold text-brand-extra1 font-mono mt-0.5">
                      {formatCurrency(report.media.custo_conversa || 0, 2)}
                    </p>
                  </div>
                </>
              ) : report.media?.leads > 0 ? (
                <>
                  <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                    <p className="text-[9px] uppercase font-mono text-brand-terciar/60">Cadastros</p>
                    <p className="text-lg font-bold text-sky-700 font-mono mt-0.5">
                      {formatNumber(report.media.leads)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                    <p className="text-[9px] uppercase font-mono text-brand-terciar/60">Custo por cadastro</p>
                    <p className="text-lg font-bold text-brand-extra1 font-mono mt-0.5">
                      {formatCurrency(report.media.custo_lead || 0, 2)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                    <p className="text-[9px] uppercase font-mono text-brand-terciar/60">Engajamento</p>
                    <p className="text-lg font-bold text-brand-extra1 font-mono mt-0.5">
                      {formatNumber(report.media?.engajamento || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10">
                    <p className="text-[9px] uppercase font-mono text-brand-terciar/60">Custo por clique</p>
                    <p className="text-lg font-bold text-brand-extra1 font-mono mt-0.5">
                      {formatCurrency(report.media?.cpc || 0, 2)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section: Comunidade no Instagram */}
          {report.instagram && (
            <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-terciar/10">
                <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-secundar" />
                  Comunidade no Instagram
                </h2>
                <span className="text-xs font-bold text-brand-secundar">
                  @{report.instagram.username}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-brand-principal/30 border border-brand-terciar/10 flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-mono text-brand-terciar/60">Seguidores Hoje</p>
                  <p className="text-2xl font-bold text-brand-extra1 font-mono mt-1">
                    {formatNumber(report.instagram.seguidores)}
                  </p>
                  <p className="text-[11px] text-brand-terciar/60 mt-1">Total acumulado no perfil</p>
                </div>

                <div className="p-4 rounded-xl bg-brand-principal/30 border border-brand-terciar/10 flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-mono text-brand-terciar/60">Novos no Período</p>
                  <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">
                    {report.instagram.ganho > 0 ? "+" : ""}
                    {formatNumber(report.instagram.ganho)}
                  </p>
                  <p className="text-[11px] text-brand-terciar/60 mt-1">Crescimento líquido no período</p>
                </div>

                {/* Growth Serie Bar Chart */}
                <div className="p-4 rounded-xl bg-brand-principal/30 border border-brand-terciar/10 flex flex-col justify-between">
                  <p className="text-[10px] uppercase font-mono text-brand-terciar/60">Evolução Diária</p>
                  {report.instagram.serie && report.instagram.serie.length > 1 ? (
                    <div className="flex items-end gap-1.5 h-16 mt-2 pt-2">
                      {report.instagram.serie.slice(-7).map((s, idx) => {
                        const prev = idx > 0 ? report.instagram!.serie[idx - 1].f : s.f;
                        const diff = s.f - prev;
                        const h = Math.min(100, Math.max(15, Math.abs(diff) * 3 + 15));
                        return (
                          <div key={s.d} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div
                              className={`w-full rounded-t transition-all ${diff >= 0 ? "bg-brand-secundar" : "bg-gray-400"}`}
                              style={{ height: `${h}%` }}
                            />
                            <span className="text-[8px] font-mono text-brand-terciar/50">
                              {s.d.split("-").slice(1).join("/")}
                            </span>
                            <div className="absolute -top-7 hidden group-hover:block bg-brand-extra1 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                              {diff > 0 ? `+${diff}` : diff}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-terciar/50 mt-2">Acompanhamento diário em andamento</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section: Conteúdo Orgânico */}
          {organico?.organico && (
            <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-terciar/10">
                <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-brand-secundar" />
                  Instagram Orgânico (Posts & Stories)
                </h2>
                <span className="text-[10px] font-mono text-brand-terciar/50">
                  @{organico.organico.username}
                </span>
              </div>

              {loadingOrganico ? (
                <div className="h-20 bg-brand-principal/30 animate-pulse rounded-xl" />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-brand-principal font-bold text-brand-extra1">
                      {organico.organico.posts?.length || 0} publicações no feed
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-brand-principal font-bold text-brand-extra1">
                      {organico.organico.stories?.length || 0} stories
                    </span>
                  </div>

                  {/* Grid de Midia Organica */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                    {organico.organico.posts?.map((p) => (
                      <a
                        key={p.id}
                        href={p.link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative rounded-xl overflow-hidden border border-brand-terciar/10 bg-brand-principal/40 aspect-square block hover:border-brand-secundar transition-all"
                      >
                        {p.img ? (
                          <PortalMediaImage
                            key={`${p.id}-${p.img}`}
                            src={p.img}
                            alt="Post Instagram"
                            className="group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-brand-terciar/50">
                            Post
                          </div>
                        )}
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded bg-black/70 text-white uppercase">
                          {p.produto === "REELS" ? "Reel" : p.tipo === "CAROUSEL_ALBUM" ? "Carrossel" : "Foto"}
                        </span>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[9px] flex justify-between items-center opacity-90">
                          <span className="font-mono">
                            {new Date(p.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </span>
                          {p.likes > 0 && <span className="font-bold">{p.likes} likes</span>}
                        </div>
                      </a>
                    ))}

                    {organico.organico.stories?.map((s) => (
                      <div
                        key={s.id}
                        className="relative rounded-xl overflow-hidden border border-brand-terciar/10 bg-brand-principal/40 aspect-square"
                      >
                        {s.img ? (
                          <PortalMediaImage
                            key={`${s.id}-${s.img}`}
                            src={s.img}
                            alt="Story Instagram"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-brand-terciar/50">
                            Story
                          </div>
                        )}
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded bg-brand-secundar text-white uppercase">
                          Story
                        </span>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[9px] font-mono">
                          {new Date(s.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Vendas por Evento */}
          {report.vendas?.eventos && report.vendas.eventos.length > 0 && (
            <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-terciar/10">
                <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-brand-secundar" />
                  Vendas por Evento / Produto
                </h2>
                <span className="text-xs font-mono font-bold text-brand-secundar">
                  Total: {formatNumber(report.vendas.total)} vendas ({formatCurrency(report.vendas.faturamento)})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.vendas.eventos.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-brand-terciar/10 bg-brand-principal/20 space-y-2"
                  >
                    <p className="text-xs font-bold text-brand-extra1 line-clamp-2">{ev.nome}</p>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-lg font-bold text-brand-secundar font-mono">
                        {formatNumber(ev.vendas)} <span className="text-xs font-sans font-normal text-brand-terciar/70">vendas</span>
                      </span>
                      <span className="text-sm font-bold text-emerald-700 font-mono">
                        {formatCurrency(ev.receita)}
                      </span>
                    </div>
                    <p className="text-[10px] text-brand-terciar/50 font-mono">Ticket médio: {formatCurrency(ev.ticket)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Criativos Campeoes */}
          {report.criativos && report.criativos.length > 0 && (
            <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-terciar/10">
                <h2 className="text-sm font-bold text-brand-extra1 flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-secundar" />
                  Criativos que Mais Performaram (Meta Ads)
                </h2>
                <span className="text-[10px] font-mono text-brand-terciar/50">Ranqueado por resultado</span>
              </div>

              <div className="space-y-4">
                {report.criativos.map((g, gIdx) => (
                  <div key={gIdx} className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-terciar/70">
                      {g.obj} <span className="font-normal text-brand-terciar/50">(por {g.unidade})</span>
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {g.cards.map((c, cIdx) => (
                        <div
                          key={c.id}
                          onClick={() => openAdPreview(c.id)}
                          className="group relative rounded-xl border border-brand-terciar/10 bg-brand-principal/20 overflow-hidden cursor-pointer hover:border-brand-secundar transition-all p-3 flex flex-col justify-between space-y-2"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-brand-principal border border-brand-terciar/10">
                            {c.thumb ? (
                              <img
                                src={c.thumb}
                                alt={c.nome}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-brand-terciar/40">
                                Criativo
                              </div>
                            )}
                            <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-brand-extra1 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                              {cIdx + 1}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-brand-extra1 truncate">{c.nome}</p>
                            <p className="text-[10px] text-brand-terciar/60 truncate">{c.sub}</p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-brand-terciar/10 text-xs">
                            <span className="font-bold text-brand-secundar font-mono">
                              {formatNumber(c.valor)} {g.unidade}
                            </span>
                            <span className="text-[10px] font-semibold text-brand-secundar group-hover:underline inline-flex items-center gap-0.5">
                              ver <ArrowUpRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Leitura do Mes */}
          {report.leitura_custom && (
            <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-secundar">
                Leitura do Mês
              </h2>
              <div
                className="text-xs text-brand-terciar leading-relaxed"
                dangerouslySetInnerHTML={{ __html: report.leitura_custom }}
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Modal Preview de Anúncio */}
      <AnimatePresence>
        {previewAdId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setPreviewAdId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-brand-terciar/10 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-brand-terciar/10">
                <span className="text-xs font-bold text-brand-extra1">
                  Preview do Anúncio Meta Ads
                </span>
                <button
                  onClick={() => setPreviewAdId(null)}
                  className="p-1 rounded-lg hover:bg-brand-principal text-brand-terciar/60 hover:text-brand-extra1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto min-h-[250px] flex items-center justify-center">
                {loadingPreview ? (
                  <div className="flex items-center gap-2 text-xs text-brand-terciar/60">
                    <RefreshCw className="w-4 h-4 animate-spin text-brand-secundar" />
                    Carregando preview do anúncio...
                  </div>
                ) : (
                  <div
                    className="w-full flex justify-center overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: previewHtml || "" }}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
