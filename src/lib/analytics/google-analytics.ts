/**
 * Google Analytics Provider (GA4 Data API)
 *
 * Autenticacao via Service Account (Google Cloud).
 * consome a GA4 Data API v1 e mapeia os resultados para
 * UnifiedAnalyticsMetric.
 *
 * Nota: O SDK @google-analytics/data esta em "preview" por isso
 * a versao deve ser pin (sem ^) e todos os tipos do SDK ficam
 * isolados neste arquivo. Callers nunca importam do SDK diretamente.
 */

import type {
  AnalyticsProvider,
  ProviderResult,
  ProviderStatus,
  UnifiedAnalyticsMetric,
} from "./types";
import { decrypt, encrypt, isEncryptionConfigured } from "./credential-store";

// ---------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------

const PROVIDER_ID = "google_analytics" as const;
const DISPLAY_NAME = "Google Analytics";
const CONFIG_KEY = "analytics_google_analytics_credentials";
const PROPERTY_KEY = "analytics_google_analytics_property_id";

// ---------------------------------------------------------------
// Tipos internos (SDK isolado)
// ---------------------------------------------------------------

interface GA4DateRange {
  startDate: string;
  endDate: string;
}

// ---------------------------------------------------------------
// Helpers de credenciais
// ---------------------------------------------------------------

async function getCredentials(): Promise<{
  serviceAccount: Record<string, unknown> | null;
  propertyId: string | null;
}> {
  if (!isEncryptionConfigured()) return { serviceAccount: null, propertyId: null };

  const { prisma: p, isDatabaseConnected: isConnected } = await import("../db");
  if (!p || !isConnected()) return { serviceAccount: null, propertyId: null };

  try {
    const credRecord = await p.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });
    const propRecord = await p.systemConfig.findUnique({
      where: { key: PROPERTY_KEY },
    });

    if (!credRecord) return { serviceAccount: null, propertyId: null };

    const decrypted = decrypt(JSON.parse(credRecord.value));
    const serviceAccount = JSON.parse(decrypted);
    const propertyId = propRecord?.value || null;

    return { serviceAccount, propertyId };
  } catch {
    return { serviceAccount: null, propertyId: null };
  }
}

async function saveCredentials(
  serviceAccountJson: string,
  propertyId: string,
): Promise<void> {
  if (!isEncryptionConfigured()) {
    throw new Error("ENCRYPTION_KEY nao configurada");
  }
  const { prisma: p, isDatabaseConnected: isConnected } = await import("../db");
  if (!p || !isConnected()) {
    throw new Error("Banco de dados nao disponivel");
  }

  const encrypted = encrypt(serviceAccountJson);
  const encryptedJson = JSON.stringify(encrypted);

  await p.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: encryptedJson },
    update: { value: encryptedJson },
  });

  await p.systemConfig.upsert({
    where: { key: PROPERTY_KEY },
    create: { key: PROPERTY_KEY, value: propertyId },
    update: { value: propertyId },
  });
}

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

class GoogleAnalyticsProvider implements AnalyticsProvider {
  readonly providerId = PROVIDER_ID;
  readonly displayName = DISPLAY_NAME;
  readonly authMethod = "service_account" as const;

  async isConfigured(): Promise<boolean> {
    const { serviceAccount, propertyId } = await getCredentials();
    return !!serviceAccount && !!propertyId;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { serviceAccount, propertyId } = await getCredentials();
      if (!serviceAccount) {
        return { success: false, message: "Service Account nao configurada" };
      }
      if (!propertyId) {
        return { success: false, message: "Property ID nao configurado" };
      }

      // Import dinamico do SDK para isolacao
      // O pacote @google-analytics/data deve ser instalado:
      // npm install @google-analytics/data (pin de versao, sem ^)
      let BetaAnalyticsDataClient: new (opts: {
        credentials: Record<string, string>;
      }) => {
        getMetadata: (req: { name: string }) => Promise<unknown>;
        runReport: (req: unknown) => Promise<unknown[]>;
      };

      try {
        const modulePath = "@google-analytics/data" as string;
        const mod = (await import(/* @vite-ignore */ modulePath)) as {
          BetaAnalyticsDataClient: new (opts: {
            credentials: Record<string, string>;
          }) => {
            getMetadata: (req: { name: string }) => Promise<unknown>;
            runReport: (req: unknown) => Promise<unknown[]>;
          };
        };
        BetaAnalyticsDataClient = mod.BetaAnalyticsDataClient;
      } catch {
        return {
          success: false,
          message:
            "SDK @google-analytics/data nao instalado. " +
            "Execute: npm install @google-analytics/data",
        };
      }

      const client = new BetaAnalyticsDataClient({
        credentials: serviceAccount as Record<string, string>,
      });

      // Chamada leve: apenas metadata da propriedade
      await client.getMetadata({
        name: `properties/${propertyId}/metadata`,
      });

      return { success: true, message: "Conexao validada com sucesso" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, message: `Erro: ${msg}` };
    }
  }

  async fetchMetrics(
    businessUnitId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ProviderResult> {
    const { serviceAccount, propertyId } = await getCredentials();

    if (!serviceAccount || !propertyId) {
      return {
        metrics: [],
        fetchedAt: new Date(),
        isMock: false,
        warnings: ["Credenciais do Google Analytics nao configuradas"],
      };
    }

    try {
      let BetaAnalyticsDataClient: new (opts: {
        credentials: Record<string, string>;
      }) => {
        getMetadata: (req: { name: string }) => Promise<unknown>;
        runReport: (req: unknown) => Promise<
          Array<{
            rows?: Array<{
              dimensionValues?: Array<{ value?: string }>;
              metricValues?: Array<{ value?: string }>;
            }>;
            metricHeaders?: Array<{ name?: string }>;
          }>
        >;
      };

      try {
        const modulePath = "@google-analytics/data" as string;
        const mod = (await import(/* @vite-ignore */ modulePath)) as {
          BetaAnalyticsDataClient: new (opts: {
            credentials: Record<string, string>;
          }) => {
            getMetadata: (req: { name: string }) => Promise<unknown>;
            runReport: (req: unknown) => Promise<
              Array<{
                rows?: Array<{
                  dimensionValues?: Array<{ value?: string }>;
                  metricValues?: Array<{ value?: string }>;
                }>;
                metricHeaders?: Array<{ name?: string }>;
              }>
            >;
          };
        };
        BetaAnalyticsDataClient = mod.BetaAnalyticsDataClient;
      } catch {
        return {
          metrics: [],
          fetchedAt: new Date(),
          isMock: false,
          warnings: ["SDK @google-analytics/data nao instalado"],
        };
      }

      const client = new BetaAnalyticsDataClient({
        credentials: serviceAccount as Record<string, string>,
      });

      const fmtDate = (d: Date) => d.toISOString().split("T")[0];
      const response = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate: fmtDate(startDate),
            endDate: fmtDate(endDate),
          } as GA4DateRange,
        ],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
      });

      const rows: UnifiedAnalyticsMetric[] = [];

      const report = response?.[0];
      if (report && report.rows) {
        const headerNames: string[] =
          report.metricHeaders?.map((h) => h.name || "") || [];

        for (const row of report.rows) {
          const dateStr = row.dimensionValues?.[0]?.value;
          if (!dateStr) continue;

          // GA4 retorna data no formato YYYYMMDD
          const date = new Date(
            parseInt(dateStr.slice(0, 4)),
            parseInt(dateStr.slice(4, 6)) - 1,
            parseInt(dateStr.slice(6, 8)),
          );

          const getMetric = (name: string): number => {
            const idx = headerNames.indexOf(name);
            if (idx < 0) return 0;
            const val = row.metricValues?.[idx]?.value;
            return val ? parseFloat(val) : 0;
          };

          rows.push({
            businessUnitId,
            date,
            source: PROVIDER_ID,
            pageViews: getMetric("screenPageViews"),
            uniqueVisitors: getMetric("activeUsers"),
            sessions: getMetric("sessions"),
            bounceRate: getMetric("bounceRate"),
            avgSessionDuration: Math.round(getMetric("averageSessionDuration")),
          });
        }
      }

      return {
        metrics: rows,
        fetchedAt: new Date(),
        isMock: false,
        warnings: [],
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        metrics: [],
        fetchedAt: new Date(),
        isMock: false,
        warnings: [`Erro ao buscar dados do GA4: ${msg}`],
      };
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    const configured = await this.isConfigured();

    let lastSyncAt: Date | null = null;
    let lastSyncStatus: "success" | "error" | "never" = "never";
    let lastErrorMessage: string | undefined;

    try {
      const { prisma: p, isDatabaseConnected: isConnected } = await import("../db");
      if (p && isConnected()) {
        const log = await p.systemConfig.findUnique({
          where: { key: `analytics_${PROVIDER_ID}_last_sync` },
        });
        if (log?.value) {
          const data = JSON.parse(log.value);
          lastSyncAt = new Date(data.timestamp);
          lastSyncStatus = data.status || "never";
          lastErrorMessage = data.error;
        }
      }
    } catch {
      // ignore
    }

    return {
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      isConfigured: configured,
      isEnabled: configured,
      lastSyncAt,
      lastSyncStatus,
      lastErrorMessage,
    };
  }
}

// Singleton
export const googleAnalyticsProvider = new GoogleAnalyticsProvider();
export { saveCredentials as saveGACredentials };
