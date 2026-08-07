/**
 * YouTube Analytics API v2 Provider
 *
 * Autenticacao via OAuth 2.0 (NAO suporta service accounts).
 * Consome a YouTube Analytics API v2 para metricas detalhadas:
 * - tempo de exibicao (watch time)
 * - duracao media de visualizacao
 * - visualizacoes por dia
 *
 * Tokens de acesso e refresh sao armazenados criptografados
 * no model IntegrationCredential.
 */

import type {
  AnalyticsProvider,
  ProviderResult,
  ProviderStatus,
  UnifiedAnalyticsMetric,
} from "./types";
import { decrypt, encrypt, isEncryptionConfigured } from "./credential-store";

const PROVIDER_ID = "youtube_analytics" as const;
const DISPLAY_NAME = "YouTube Analytics";
const API_URL = "https://youtubeanalytics.googleapis.com/v2";
const YT_API_URL = "https://www.googleapis.com/youtube/v3";

// ---------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------

interface YTAnalyticsResponse {
  rows?: Array<
    [string, number, number, number]
    // [date, views, estimatedWatchTimeMinutes, averageViewDurationSeconds]
  >;
  columnHeaders?: Array<{ name: string; columnType: string; dataType: string }>;
}

// ---------------------------------------------------------------
// Helpers de credenciais
// ---------------------------------------------------------------

async function getCredentials(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
}> {
  if (!isEncryptionConfigured()) {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }

  const { prisma, isDatabaseConnected } = await import("../db");
  if (!prisma || !isDatabaseConnected()) {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }

  try {
    const record = await prisma.integrationCredential.findUnique({
      where: { provider: PROVIDER_ID },
    });
    if (!record) {
      return { accessToken: null, refreshToken: null, expiresAt: null };
    }

    const accessToken = decrypt(JSON.parse(record.encryptedAccessToken));
    const refreshToken = record.encryptedRefreshToken
      ? decrypt(JSON.parse(record.encryptedRefreshToken))
      : null;
    const expiresAt = record.expiresAt ? new Date(record.expiresAt) : null;

    return { accessToken, refreshToken, expiresAt };
  } catch {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }
}

async function saveCredentials(
  accessToken: string,
  refreshToken: string,
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
  const encryptedRefresh = JSON.stringify(encrypt(refreshToken));

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
 * Verifica se o token expirou ou esta proximo (5 min).
 */
function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  const now = new Date();
  const buffer = 5 * 60 * 1000;
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
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const url = "https://oauth2.googleapis.com/token";
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) return null;
    const data = await res.json() as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) return null;

    const newExpiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined;

    await saveCredentials(data.access_token, refreshToken, newExpiresAt);
    return data.access_token;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

class YouTubeAnalyticsProvider implements AnalyticsProvider {
  readonly providerId = PROVIDER_ID;
  readonly displayName = DISPLAY_NAME;
  readonly authMethod = "oauth" as const;

  async isConfigured(): Promise<boolean> {
    const { accessToken } = await getCredentials();
    return !!accessToken;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { accessToken, expiresAt, refreshToken } = await getCredentials();
      if (!accessToken) {
        return { success: false, message: "Token OAuth nao configurado" };
      }

      const token = await refreshTokenIfNeeded(accessToken, refreshToken, expiresAt);
      if (!token) {
        return { success: false, message: "Token expirado e sem refresh token" };
      }

      // Resolver ID do canal autenticado
      const channelUrl = `${YT_API_URL}/channels?part=snippet&mine=true&access_token=${encodeURIComponent(token)}`;
      const res = await fetch(channelUrl);

      if (res.ok) {
        const data = await res.json() as {
          items?: Array<{ snippet: { title: string } }>;
        };
        const title = data.items?.[0]?.snippet?.title;
        return {
          success: true,
          message: `Canal autenticado: ${title || "(desconhecido)"}`,
        };
      }

      const err = await res.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } }).error?.message || `${res.status}`;
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
    const { accessToken, expiresAt, refreshToken } = await getCredentials();

    if (!accessToken) {
      return {
        metrics: [],
        fetchedAt: new Date(),
        isMock: false,
        warnings: ["YouTube Analytics OAuth nao configurado"],
      };
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

    try {
      const fmtDate = (d: Date) => d.toISOString().split("T")[0];
      const since = fmtDate(startDate);
      const until = fmtDate(endDate);

      // Query: views, watch time, avg view duration por dia
      const reportUrl =
        `${API_URL}/reports?` +
        `ids=channel==MINE&` +
        `start-date=${since}&` +
        `end-date=${until}&` +
        `metrics=views,estimatedWatchTimeMinutes,averageViewDurationSeconds&` +
        `dimensions=day&` +
        `access_token=${encodeURIComponent(token)}`;

      const res = await fetch(reportUrl);
      const warnings: string[] = [];

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as { error?: { message?: string } }).error?.message || res.status;
        warnings.push(`Erro YouTube Analytics: ${msg}`);
        return { metrics: [], fetchedAt: new Date(), isMock: false, warnings };
      }

      const data = (await res.json()) as YTAnalyticsResponse;
      const metrics: UnifiedAnalyticsMetric[] = [];

      for (const row of data.rows || []) {
        const [dateStr, views, watchTime, avgDuration] = row;
        const date = new Date(dateStr);
        if (date < startDate || date > endDate) continue;

        metrics.push({
          businessUnitId,
          date,
          source: PROVIDER_ID,
          platform: "youtube",
          views,
          watchTimeMinutes: watchTime,
          avgViewDurationSeconds: avgDuration,
        });
      }

      return { metrics, fetchedAt: new Date(), isMock: false, warnings };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        metrics: [],
        fetchedAt: new Date(),
        isMock: false,
        warnings: [`Erro YouTube Analytics: ${msg}`],
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
export const youTubeAnalyticsProvider = new YouTubeAnalyticsProvider();
export { saveCredentials as saveYouTubeAnalyticsCredentials };
