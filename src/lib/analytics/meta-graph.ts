/**
 * Meta Graph API Provider (Facebook + Instagram)
 *
 * Autenticacao via OAuth 2.0. Tokens de acesso de longa duracao
 * sao armazenados criptografados no model IntegrationCredential.
 * Consome a Meta Graph API v25.0.
 *
 * Metricas: seguidores, alcance, impressoes, engajamento.
 *
 * Nota: A metrica page_impressions_unique (Page Reach) foi
 * deprecada em junho/2026. Este provider mapeia `reach` para
 * a metrica de substituicao disponivel,
 */

import type {
  AnalyticsProvider,
  ProviderResult,
  ProviderStatus,
  UnifiedAnalyticsMetric,
} from "./types";
import { decrypt, encrypt, isEncryptionConfigured } from "./credential-store";

const PROVIDER_ID = "meta" as const;
const DISPLAY_NAME = "Meta (Facebook + Instagram)";
const API_VERSION = "v25.0";
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}`;

// ---------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------

interface MetaCredentialData {
  encryptedAccessToken: string;
  encryptedRefreshToken?: string;
  expiresAt: string | null;
  scopes?: string[];
}

interface MetaPageToken {
  page_id: string;
  page_name: string;
  access_token: string;
}

interface MetaInsightsResponse {
  data: Array<{
    name: string;
    values: Array<{ value: number | Record<string, number>; end_time: string }>;
  }>;
}

// ---------------------------------------------------------------
// Helpers de credenciais
// ---------------------------------------------------------------

async function getCredentials(): Promise<{
  accessToken: string | null;
  expiresAt: Date | null;
}> {
  if (!isEncryptionConfigured()) return { accessToken: null, expiresAt: null };

  const { prisma, isDatabaseConnected } = await import("../db");
  if (!prisma || !isDatabaseConnected()) return { accessToken: null, expiresAt: null };

  try {
    const record = await prisma.integrationCredential.findUnique({
      where: { provider: PROVIDER_ID },
    });
    if (!record) return { accessToken: null, expiresAt: null };

    const accessToken = decrypt(JSON.parse(record.encryptedAccessToken));
    const expiresAt = record.expiresAt ? new Date(record.expiresAt) : null;

    return { accessToken, expiresAt };
  } catch {
    return { accessToken: null, expiresAt: null };
  }
}

async function saveCredentials(
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date,
  scopes?: string[],
): Promise<void> {
  if (!isEncryptionConfigured()) {
    throw new Error("ENCRYPTION_KEY nao configurada");
  }
  const { prisma, isDatabaseConnected } = await import("../db");
  if (!prisma || !isDatabaseConnected()) {
    throw new Error("Banco de dados nao disponivel");
  }

  const encryptedAccess = JSON.stringify(encrypt(accessToken));
  const encryptedRefresh = refreshToken
    ? JSON.stringify(encrypt(refreshToken))
    : null;

  await prisma.integrationCredential.upsert({
    where: { provider: PROVIDER_ID },
    create: {
      provider: PROVIDER_ID,
      encryptedAccessToken: encryptedAccess,
      encryptedRefreshToken: encryptedRefresh,
      expiresAt: expiresAt || null,
      scopes: scopes?.join(" ") || null,
    },
    update: {
      encryptedAccessToken: encryptedAccess,
      encryptedRefreshToken: encryptedRefresh,
      expiresAt: expiresAt || null,
      scopes: scopes?.join(" ") || null,
    },
  });
}

/**
 * Verifica se o token expirou ou esta proximo de expirar (5 min).
 */
function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false; // Token de longa duracao sem expiracao
  const now = new Date();
  const buffer = 5 * 60 * 1000; // 5 minutos
  return expiresAt.getTime() - now.getTime() < buffer;
}

/**
 * Renova o access token usando o refresh token.
 */
async function refreshTokenIfNeeded(
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null,
): Promise<string | null> {
  if (!isTokenExpired(expiresAt)) return accessToken;
  if (!refreshToken) return null;

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) return null;

    const url = `${GRAPH_URL}/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${accessToken}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as { access_token?: string };
    if (!data.access_token) return null;

    // Atualizar no banco
    await saveCredentials(data.access_token, refreshToken);
    return data.access_token;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

class MetaGraphProvider implements AnalyticsProvider {
  readonly providerId = PROVIDER_ID;
  readonly displayName = DISPLAY_NAME;
  readonly authMethod = "oauth" as const;

  async isConfigured(): Promise<boolean> {
    const { accessToken } = await getCredentials();
    return !!accessToken;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { accessToken } = await getCredentials();
      if (!accessToken) {
        return { success: false, message: "Token de acesso nao configurado" };
      }

      const url = `${GRAPH_URL}/me?access_token=${encodeURIComponent(accessToken)}`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json() as { name?: string; id?: string };
        return {
          success: true,
          message: `Conectado como: ${data.name || data.id || "(desconhecido)"}`,
        };
      }

      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      const msg = err.error?.message || `${res.status} ${res.statusText}`;
      return { success: false, message: `Erro: ${msg}` };
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
    const { accessToken, expiresAt } = await getCredentials();

    if (!accessToken) {
      return {
        metrics: [],
        fetchedAt: new Date(),
        isMock: false,
        warnings: ["Token do Meta Graph nao configurado"],
      };
    }

    // Recuperar refresh token para renovacao se necessario
    let { prisma, isDatabaseConnected } = await import("../db");
    let refreshToken: string | null = null;
    if (prisma && isDatabaseConnected()) {
      try {
        const record = await prisma.integrationCredential.findUnique({
          where: { provider: PROVIDER_ID },
        });
        if (record?.encryptedRefreshToken) {
          refreshToken = decrypt(JSON.parse(record.encryptedRefreshToken));
        }
      } catch {
        // ignore
      }
    }

    const token = await refreshTokenIfNeeded(accessToken, refreshToken, expiresAt);

    if (!token) {
      return {
        metrics: [],
        fetchedAt: new Date(),
        isMock: false,
        warnings: ["Token expirado e sem refresh token para renovar"],
      };
    }

    const safeToken: string = token;
    const fmtDate = (d: Date) => d.toISOString().split("T")[0];
    const since = fmtDate(startDate);
    const until = fmtDate(endDate);

    const metrics: UnifiedAnalyticsMetric[] = [];
    const warnings: string[] = [];

    try {
      // Buscar paginas associadas ao usuario
      const pagesUrl = `${GRAPH_URL}/me/accounts?access_token=${encodeURIComponent(safeToken)}`;
      const pagesRes = await fetch(pagesUrl);

      if (!pagesRes.ok) {
        const err = await pagesRes.json().catch(() => ({}));
        warnings.push(`Erro ao listar paginas: ${JSON.stringify(err)}`);
        return { metrics, fetchedAt: new Date(), isMock: false, warnings };
      }

      const pagesData = await pagesRes.json() as { data: MetaPageToken[] };

      if (!pagesData.data || pagesData.data.length === 0) {
        warnings.push("Nenhuma pagina associada a este token");
        return { metrics, fetchedAt: new Date(), isMock: false, warnings };
      }

      // Para cada pagina, buscar insights
      for (const page of pagesData.data) {
        const pageToken = page.access_token;

        // Metricas de engajamento da pagina
        const insightsUrl =
          `${GRAPH_URL}/${page.page_id}/insights?` +
          `metric=page_followers,page_post_engagements,page_impressions,page_impressions_unique&` +
          `period=day&` +
          `since=${since}&until=${until}&` +
          `access_token=${encodeURIComponent(pageToken)}`;

        const insightsRes = await fetch(insightsUrl);

        if (!insightsRes.ok) {
          const err = await insightsRes.json().catch(() => ({}));
          warnings.push(`Erro insights ${page.page_name}: ${JSON.stringify(err)}`);
          continue;
        }

        const insights = (await insightsRes.json()) as MetaInsightsResponse;

        // Agrupar por data
        const byDate: Map<string, UnifiedAnalyticsMetric> = new Map();

        for (const metric of insights.data || []) {
          for (const val of metric.values) {
            const dateStr = val.end_time.split("T")[0];
            if (!byDate.has(dateStr)) {
              byDate.set(dateStr, {
                businessUnitId,
                date: new Date(dateStr),
                source: PROVIDER_ID,
                platform: "facebook",
              });
            }
            const m = byDate.get(dateStr)!;
            const numVal = typeof val.value === "number" ? val.value : 0;

            switch (metric.name) {
              case "page_followers":
                m.followersCount = numVal;
                break;
              case "page_post_engagements":
                m.engagementRate = numVal;
                break;
              case "page_impressions":
                m.impressions = numVal;
                break;
              case "page_impressions_unique":
                // Metrica depreciada - mapeia para reach como fallback
                m.reach = numVal;
                break;
            }
          }
        }

        metrics.push(...byDate.values());
      }

      // Buscar dados do Instagram se vinculado
      const igUrl =
        `${GRAPH_URL}/me/accounts?` +
        `fields=instagram_business_account&` +
        `access_token=${encodeURIComponent(safeToken)}`;
      const igRes = await fetch(igUrl);

      if (igRes.ok) {
        const igData = await igRes.json() as {
          data: Array<{ instagram_business_account?: { id: string } }>;
        };

        for (const page of igData.data || []) {
          if (!page.instagram_business_account) continue;
          const igAccountId = page.instagram_business_account.id;

          const igInsightsUrl =
            `${GRAPH_URL}/${igAccountId}/insights?` +
            `metric=impressions,reach,engagement,follower_count&` +
            `period=day&` +
            `since=${since}&until=${until}&` +
            `access_token=${encodeURIComponent(safeToken)}`;

          const igInsightsRes = await fetch(igInsightsUrl);

          if (!igInsightsRes.ok) {
            warnings.push("Erro ao buscar insights do Instagram");
            continue;
          }

          const igInsights = (await igInsightsRes.json()) as MetaInsightsResponse;
          const igByDate: Map<string, UnifiedAnalyticsMetric> = new Map();

          for (const metric of igInsights.data || []) {
            for (const val of metric.values) {
              const dateStr = val.end_time.split("T")[0];
              if (!igByDate.has(dateStr)) {
                igByDate.set(dateStr, {
                  businessUnitId,
                  date: new Date(dateStr),
                  source: PROVIDER_ID,
                  platform: "instagram",
                });
              }
              const m = igByDate.get(dateStr)!;
              const numVal = typeof val.value === "number" ? val.value : 0;

              switch (metric.name) {
                case "follower_count":
                  m.followersCount = numVal;
                  break;
                case "engagement":
                  m.engagementRate = numVal;
                  break;
                case "impressions":
                  m.impressions = numVal;
                  break;
                case "reach":
                  m.reach = numVal;
                  break;
              }
            }
          }

          metrics.push(...igByDate.values());
        }
      }

      return {
        metrics,
        fetchedAt: new Date(),
        isMock: false,
        warnings,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        metrics,
        fetchedAt: new Date(),
        isMock: false,
        warnings: [`Erro Meta Graph: ${msg}`],
      };
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    const configured = await this.isConfigured();

    let lastSyncAt: Date | null = null;
    let lastSyncStatus: "success" | "error" | "never" = "never";
    let lastErrorMessage: string | undefined;

    try {
      const { prisma, isDatabaseConnected } = await import("../db");
      if (prisma && isDatabaseConnected()) {
        const log = await prisma.systemConfig.findUnique({
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
export const metaGraphProvider = new MetaGraphProvider();
export { saveCredentials as saveMetaCredentials };
