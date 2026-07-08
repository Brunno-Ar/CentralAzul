"use client";

import { useState, useEffect, useCallback } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { BarChart3, RefreshCw, Check, X, AlertCircle, Loader2 } from "lucide-react";

interface ProviderStatus {
  providerId: string;
  displayName: string;
  isConfigured: boolean;
  isEnabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: "success" | "error" | "never";
  lastErrorMessage?: string;
}

interface SyncResult {
  providerId: string;
  businessUnitId: string;
  status: "idle" | "running" | "success" | "error";
  metricsCount: number;
  duration: number;
  errorMessage?: string;
  warnings?: string[];
}

interface ApiConfigResponse {
  providers: ProviderStatus[];
  syncHistory: Array<{
    timestamp: string;
    status: string;
    error?: string;
    metricsCount?: number;
  }>;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "Nunca";
  const d = new Date(dateStr);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusColors: Record<string, string> = {
  success: "text-green-600 bg-green-50 border-green-200",
  error: "text-red-600 bg-red-50 border-red-200",
  never: "text-gray-500 bg-gray-50 border-gray-200",
};

const statusIcons: Record<string, typeof Check> = {
  success: Check,
  error: X,
  never: AlertCircle,
};

export default function AnalyticsSettingsClient() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/config");
      if (res.ok) {
        const data = (await res.json()) as ApiConfigResponse;
        setProviders(data.providers || []);
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar configuracoes" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSyncAll = async () => {
    setSyncing(true);
    setMessage(null);
    setSyncResults(null);
    try {
      const res = await fetch("/api/analytics/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncResults(data.results || []);
        setMessage({
          type: "success",
          text: `Sincronizacao concluida: ${data.syncedUnits} unidades processadas`,
        });
        fetchConfig();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Erro na sincronizacao",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de comunicacao com o servidor" });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    setMessage(null);
    try {
      const res = await fetch("/api/analytics/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", providerId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `${providerId}: ${data.message}` });
      } else {
        setMessage({ type: "error", text: data.message || data.error || "Erro no teste" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de comunicacao" });
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-brand-secundar" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-terciar">
              Configuracoes de Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie integracoes de metricas e sincronizacao de dados
            </p>
          </div>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-secundar text-white text-sm font-medium hover:bg-brand-secundar/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Tudo"}
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg border text-sm ${
              message.type === "success"
                ? "text-green-600 bg-green-50 border-green-200"
                : "text-red-600 bg-red-50 border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {providers.map((provider) => {
            const StatusIcon = statusIcons[provider.lastSyncStatus] || AlertCircle;
            return (
              <div
                key={provider.providerId}
                className="border rounded-lg p-4 bg-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        provider.isConfigured
                          ? "bg-brand-secundar/10 text-brand-secundar"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-brand-terciar">
                        {provider.displayName}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {provider.isConfigured ? "Configurado" : "Nao configurado"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full border text-xs flex items-center gap-1.5 ${
                      statusColors[provider.lastSyncStatus]
                    }`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {provider.lastSyncStatus === "success"
                      ? "Operacional"
                      : provider.lastSyncStatus === "error"
                        ? "Com falhas"
                        : "Nunca sincronizado"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Ultima sincronizacao:</span>
                    <p className="font-medium text-brand-terciar">
                      {formatDate(provider.lastSyncAt)}
                    </p>
                  </div>
                  {provider.lastErrorMessage && (
                    <div>
                      <span className="text-gray-500">Ultimo erro:</span>
                      <p className="text-red-600 text-xs mt-0.5">
                        {provider.lastErrorMessage}
                      </p>
                    </div>
                  )}
                </div>

                {provider.isConfigured && (
                  <button
                    onClick={() => handleTestConnection(provider.providerId)}
                    className="text-xs px-3 py-1.5 rounded-md border border-brand-secundar/30 text-brand-secundar hover:bg-brand-secundar/5 transition-colors"
                  >
                    Testar Conexao
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {syncResults && syncResults.length > 0 && (
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-semibold text-brand-terciar mb-3">
              Resultados da Sincronizacao
            </h3>
            <div className="space-y-2">
              {syncResults.map((r, i) => (
                <div
                  key={`sync-${r.providerId}-${i}`}
                  className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                >
                  <span className="font-medium">{r.providerId}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">
                      {r.metricsCount} metricas
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        r.status === "success"
                          ? "text-green-600 bg-green-50"
                          : "text-red-600 bg-red-50"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
