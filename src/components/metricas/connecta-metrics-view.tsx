"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bot, CheckCircle2, MessageSquare, RefreshCw, Users } from "lucide-react";

interface ConnectaData {
  summary: { totalInteractions: number; totalSelections: number; uniqueContacts: number };
  selections: { key: string; value: string; selectionCount: number; uniqueContacts: number }[];
  bots: { botId: string; totalInteractions: number; totalSelections: number; uniqueContacts: number }[];
  updatedAt: string;
}

export default function ConnectaMetricsView() {
  const [connectaData, setConnectaData] = useState<ConnectaData | null>(null);
  const [connectaLoading, setConnectaLoading] = useState(false);
  const [connectaError, setConnectaError] = useState<string | null>(null);

  const fetchConnectaMetrics = useCallback(async () => {
    setConnectaLoading(true);
    setConnectaError(null);
    try {
      const res = await fetch("/api/connecta");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao obter dados do Connecta");
      }
      setConnectaData(await res.json() as ConnectaData);
    } catch (err: unknown) {
      console.error(err);
      setConnectaError(err instanceof Error ? err.message : "Erro desconhecido ao carregar métricas do Connecta");
    } finally {
      setConnectaLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConnectaMetrics();
  }, [fetchConnectaMetrics]);

  return (        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-brand-terciar/10 bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-brand-extra1">
                Connecta CX (WhatsApp)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {connectaData?.updatedAt && (
                <span className="text-[11px] font-mono text-brand-terciar/60">
                  Atualizado: {new Date(connectaData.updatedAt).toLocaleTimeString("pt-BR")}
                </span>
              )}

              <button
                onClick={() => fetchConnectaMetrics()}
                disabled={connectaLoading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-terciar/20 bg-white hover:bg-brand-principal text-brand-extra1 transition-colors disabled:opacity-50 transform-gpu"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${connectaLoading ? "animate-spin text-brand-secundar" : ""}`} />
                Atualizar
              </button>
            </div>
          </div>

          {connectaError && (
            <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-800 text-xs font-semibold">
              {connectaError}
            </div>
          )}

          {/* Cards Principais - Apenas o Essencial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-secundar/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-brand-secundar" />
                </div>
                <div>
                  <p className="text-xs text-brand-terciar/60">Conversas Iniciadas</p>
                  <p className="text-2xl font-bold text-brand-extra1 font-mono">{connectaLoading ? "..." : connectaData?.summary.totalInteractions?.toLocaleString("pt-BR") || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-brand-terciar/60">Pessoas Únicas</p>
                  <p className="text-2xl font-bold text-emerald-700 font-mono">{connectaLoading ? "..." : connectaData?.summary.uniqueContacts?.toLocaleString("pt-BR") || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-brand-terciar/60">Total de Respostas</p>
                  <p className="text-2xl font-bold text-amber-700 font-mono">{connectaLoading ? "..." : connectaData?.summary.totalSelections?.toLocaleString("pt-BR") || 0}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* O Que as Pessoas Mais Perguntam/Escolhem - Top 6 */}
          {!connectaLoading && connectaData && connectaData.selections && connectaData.selections.length > 0 && (
            <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm">
              <h3 className="text-sm font-bold text-brand-extra1 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-secundar" />
                Principais Interesses
              </h3>
              <div className="space-y-2">
                {connectaData.selections
                  .filter(s => {
                    const val = String(s.value ?? "");
                    return val.trim() !== "" && !val.includes("{{");
                  })
                  .slice(0, 6)
                  .map((sel, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10 transition-colors hover:border-brand-secundar/30">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-7 h-7 rounded-full bg-brand-secundar/10 text-brand-secundar text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-brand-extra1 truncate">{sel.value}</p>
                          <p className="text-[10px] text-brand-terciar/50 truncate">{sel.key.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-bold text-brand-extra1 px-2.5 py-1 rounded-full bg-brand-secundar/10 text-brand-secundar shrink-0">
                        {sel.selectionCount}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Trilhas Ativas - Resumo Simples */}
          {!connectaLoading && connectaData && connectaData.bots && connectaData.bots.length > 0 && (
            <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm">
              <h3 className="text-sm font-bold text-brand-extra1 mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand-secundar" />
                Trilhas Ativas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connectaData.bots
                  .filter(b => b.totalInteractions > 0)
                  .slice(0, 4)
                  .map((bot) => (
                    <div key={bot.botId} className="p-3 rounded-xl bg-brand-principal/30 border border-brand-terciar/10 flex items-center justify-between">
                      <span className="text-xs font-medium text-brand-extra1 truncate">{bot.botId.replace(/_/g, " ")}</span>
                      <div className="flex items-center gap-2 text-[10px] text-brand-terciar/60">
                        <span className="font-mono font-bold text-brand-extra1">{bot.totalInteractions}</span>
                        <span>conversas</span>
                        <span>·</span>
                        <span className="font-mono font-bold text-emerald-600">{bot.uniqueContacts}</span>
                        <span>pessoas</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {connectaLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-brand-principal animate-pulse rounded-2xl border border-brand-terciar/10" />
              ))}
            </div>
          )}
        </div>
  );
}

