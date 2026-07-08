/**
 * YouTube Data API v3 Provider
 *
 * Autenticacao via API Key (dados publicos de canal).
 * Consome a YouTube Data API v3 para metricas publicas:
 * - visualizacoes do canal
 * - inscritos
 * - numero de videos publicados
 *
 * Para watch time e metricas detalhadas, usar youtube-analytics.ts
 * (YouTube Analytics API v2 com OAuth).
 */

import type {
  AnalyticsProvider,
  ProviderResult,
  ProviderStatus,
  UnifiedAnalyticsMetric,
} from "./types";
import { decrypt, encrypt, isEncryptionConfigured } from "./credential-store";

const PROVIDER_ID = "youtube_data" as const;
const DISPLAY_NAME = "YouTube (Canal)";
const CONFIG_KEY = "analytics_youtube_data_api_key";
const CHANNEL_KEY = "analytics_youtube_data_channel_id";
const API_URL = "https://www.googleapis.com/youtube/v3";

// ---------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------

interface YouTubeChannelResponse {
  items?: Array<{
    id: string;
    snippet: { title: string };
    statistics: {
      viewCount: string;
      subscriberCount: string;
      videoCount: string;
    };
  }>;
}

// ---------------------------------------------------------------
// Helpers de credenciais
// ---------------------------------------------------------------

async function getCredentials(): Promise<{
  apiKey: string | null;
  channelId: string | null;
}> {
  if (!isEncryptionConfigured()) return { apiKey: null, channelId: null };

  const { prisma, isDatabaseConnected } = await import("../db");
  if (!prisma || !isDatabaseConnected()) return { apiKey: null, channelId: null };

  try {
    const keyRecord = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });
    const channelRecord = await prisma.systemConfig.findUnique({
      where: { key: CHANNEL_KEY },
    });

    if (!keyRecord) return { apiKey: null, channelId: null };

    const apiKey = decrypt(JSON.parse(keyRecord.value));
    const channelId = channelRecord?.value || null;

    return { apiKey, channelId };
  } catch {
    return { apiKey: null, channelId: null };
  }
}

async function saveCredentials(
  apiKey: string,
  channelId: string,
): Promise<void> {
  if (!isEncryptionConfigured()) {
    throw new Error("ENCRYPTION_KEY nao configurada");
  }
  const { prisma, isDatabaseConnected } = await import("../db");
  if (!prisma || !isDatabaseConnected()) {
    throw new Error("Banco de dados nao disponivel");
  }

  const encrypted = JSON.stringify(encrypt(apiKey));

  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: encrypted },
    update: { value: encrypted },
  });

  await prisma.systemConfig.upsert({
    where: { key: CHANNEL_KEY },
    create: { key: CHANNEL_KEY, value: channelId },
    update: { value: channelId },
  });
}

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

class YouTubeDataProvider implements AnalyticsProvider {
  readonly providerId = PROVIDER_ID;
  readonly displayName = DISPLAY_NAME;
  readonly authMethod = "api_key" as const;

  async isConfigured(): Promise<boolean> {
    const { apiKey, channelId } = await getCredentials();
    return !!apiKey && !!channelId;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { apiKey, channelId } = await getCredentials();
      if (!apiKey) {
        return { success: false, message: "API Key nao configurada" };
      }
      if (!channelId) {
        return { success: false, message: "Channel ID nao configurado" };
      }

      const url =
        `${API_URL}/channels?` +
        `part=snippet,statistics&` +
        `id=${encodeURIComponent(channelId)}&` +
        `key=${encodeURIComponent(apiKey)}`;

      const res = await fetch(url);

      if (res.ok) {
        const data = (await res.json()) as YouTubeChannelResponse;
        if (data.items && data.items.length > 0) {
          const ch = data.items[0];
          return {
            success: true,
            message: `Canal: ${ch.snippet.title} (${ch.statistics.subscriberCount} inscritos)`,
          };
        }
        return { success: false, message: "Canal nao encontrado com este ID" };
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
    const { apiKey, channelId } = await getCredentials();

    if (!apiKey || !channelId) {
      return {
        metrics: [],
        fetchedAt: new Date(),
        isMock: false,
        warnings: ["YouTube Data API nao configurada"],
      };
    }

    try {
      // Buscar estatisticas do canal (snapshot atual)
      const channelUrl =
        `${API_URL}/channels?` +
        `part=snippet,statistics&` +
        `id=${encodeURIComponent(channelId)}&` +
        `key=${encodeURIComponent(apiKey)}`;

      const channelRes = await fetch(channelUrl);

      if (!channelRes.ok) {
        const err = await channelRes.json().catch(() => ({}));
        return {
          metrics: [],
          fetchedAt: new Date(),
          isMock: false,
          warnings: [`Erro YouTube Data API: ${JSON.stringify(err)}`],
        };
      }

      const channelData = (await channelRes.json()) as YouTubeChannelResponse;

      if (!channelData.items || channelData.items.length === 0) {
        return {
          metrics: [],
          fetchedAt: new Date(),
          isMock: false,
          warnings: ["Canal nao encontrado"],
        };
      }

      const ch = channelData.items[0];
      const metric: UnifiedAnalyticsMetric = {
        businessUnitId,
        date: new Date(), // Snapshot do momento
        source: PROVIDER_ID,
        platform: "youtube",
        views: parseInt(ch.statistics.viewCount) || 0,
        subscribers: parseInt(ch.statistics.subscriberCount) || 0,
        videoCount: parseInt(ch.statistics.videoCount) || 0,
      };

      // Buscar videos recentes para obter dados por dia
      // Primeiro obter a playlist de uploads do canal
      const uploadsUrl =
        `${API_URL}/channels?` +
        `part=contentDetails&` +
        `id=${encodeURIComponent(channelId)}&` +
        `key=${encodeURIComponent(apiKey)}`;

      const uploadsRes = await fetch(uploadsUrl);
      const uploadsData = await uploadsRes.json() as {
        items?: Array<{ contentDetails: { relatedPlaylists: { uploads?: string } } }>;
      };

      const uploadsPlaylistId =
        uploadsData.items?.[0]?.contentDetails.relatedPlaylists.uploads;

      const dailyMetrics: UnifiedAnalyticsMetric[] = [];

      if (uploadsPlaylistId) {
        // Buscar videos do upload playlist
        const playlistUrl =
          `${API_URL}/playlistItems?` +
          `part=snippet&` +
          `playlistId=${encodeURIComponent(uploadsPlaylistId)}&` +
          `maxResults=50&` +
          `key=${encodeURIComponent(apiKey)}`;

        const playlistRes = await fetch(playlistUrl);
        if (playlistRes.ok) {
          const playlistData = await playlistRes.json() as {
            items?: Array<{ snippet: { publishedAt: string; title: string } }>;
          };

          // Agrupar videos publicados por dia no periodo
          const byDate: Map<string, UnifiedAnalyticsMetric> = new Map();

          for (const item of playlistData.items || []) {
            const pubDate = new Date(item.snippet.publishedAt);
            if (pubDate < startDate || pubDate > endDate) continue;

            const dateStr = pubDate.toISOString().split("T")[0];
            if (!byDate.has(dateStr)) {
              byDate.set(dateStr, {
                businessUnitId,
                date: pubDate,
                source: PROVIDER_ID,
                platform: "youtube",
                views: 0,
                subscribers: 0,
                videoCount: 0,
              });
            }
            byDate.get(dateStr)!.videoCount!++;
          }

          dailyMetrics.push(...byDate.values());
        }
      }

      // Incluir snapshot atual
      const allMetrics = [metric, ...dailyMetrics];

      return {
        metrics: allMetrics,
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
        warnings: [`Erro YouTube Data API: ${msg}`],
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
export const youTubeDataProvider = new YouTubeDataProvider();
export { saveCredentials as saveYouTubeDataCredentials };
