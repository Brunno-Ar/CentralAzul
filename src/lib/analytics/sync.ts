/**
 * Analytics Sync Orchestrator
 *
 * Coordena a sincronizacao de metricas de todos os providers
 * configurados. Suporta sincronizacao manual e automatica (cron),
 * com retry exponential backoff, logs e controle de falhas.
 */

import type {
  AnalyticsProvider,
  ProviderId,
  ProviderResult,
  SyncResult,
  SyncStatus,
  UnifiedAnalyticsMetric,
} from "./types";
import { getProviderRegistry } from "./registry";
import { prisma, isDatabaseConnected } from "../db";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;
const SYNC_LOG_PREFIX = "analytics_sync";

// ---------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------

interface SyncOptions {
  businessUnitId: string;
  providerId?: ProviderId;
  startDate?: Date;
  endDate?: Date;
  isManual?: boolean;
}

interface SyncLogRecord {
  timestamp: string;
  status: "success" | "error" | "running";
  error?: string;
  metricsCount?: number;
  duration?: number;
}

type BusinessUnitLookup = { id: string; slug: string }[];

interface PersistedMetric {
  businessUnitId: string;
  date: Date;
  pageViews?: number;
  uniqueVisitors?: number;
  sessions?: number;
  bounceRate?: number;
  avgSessionDuration?: number;
  source: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------
 // Persistencia de metricas
// ---------------------------------------------------------------

async function persistTrafficMetrics(
  metrics: UnifiedAnalyticsMetric[],
): Promise<number> {
  let count = 0;
  if (!prisma || !isDatabaseConnected()) return 0;

  for (const m of metrics) {
    if (!m.pageViews && !m.uniqueVisitors && !m.sessions) continue;

    try {
      const existing = await prisma.businessUnitAnalytics.findFirst({
        where: {
          businessUnitId: m.businessUnitId,
          date: m.date,
          source: m.source,
        },
      });

      if (existing) {
        await prisma.businessUnitAnalytics.update({
          where: { id: existing.id },
          data: {
            pageViews: m.pageViews || 0,
            uniqueVisitors: m.uniqueVisitors || 0,
            sessions: m.sessions || 0,
            bounceRate: m.bounceRate || 0,
            avgSessionDuration: m.avgSessionDuration || 0,
          },
        });
      } else {
        await prisma.businessUnitAnalytics.create({
          data: {
            businessUnitId: m.businessUnitId,
            date: m.date,
            pageViews: m.pageViews || 0,
            uniqueVisitors: m.uniqueVisitors || 0,
            sessions: m.sessions || 0,
            bounceRate: m.bounceRate || 0,
            avgSessionDuration: m.avgSessionDuration || 0,
            source: m.source,
          },
        });
      }
      count++;
    } catch (e) {
      console.error("Error persisting traffic metric", e);
    }
  }
  return count;
}

async function persistSocialMetrics(
  metrics: UnifiedAnalyticsMetric[],
): Promise<number> {
  let count = 0;
  if (!prisma || !isDatabaseConnected()) return 0;

  for (const m of metrics) {
    if (!m.platform) continue;
    if (
      m.followersCount === undefined &&
      m.reach === undefined &&
      m.impressions === undefined
    ) {
      continue;
    }

    try {
      const existing = await prisma.businessUnitMetaData.findFirst({
        where: {
          businessUnitId: m.businessUnitId,
          date: m.date,
          platform: m.platform,
        },
      });

      if (existing) {
        await prisma.businessUnitMetaData.update({
          where: { id: existing.id },
          data: {
            followersCount: m.followersCount ?? existing.followersCount,
            followingCount: m.followingCount ?? existing.followingCount,
            postsCount: m.postsCount ?? existing.postsCount,
            engagementRate: m.engagementRate ?? existing.engagementRate,
            reach: m.reach ?? existing.reach,
            impressions: m.impressions ?? existing.impressions,
            watchTimeMinutes: m.watchTimeMinutes ?? existing.watchTimeMinutes,
            avgViewDurationSeconds:
              m.avgViewDurationSeconds ?? existing.avgViewDurationSeconds,
          },
        });
      } else {
        await prisma.businessUnitMetaData.create({
          data: {
            businessUnitId: m.businessUnitId,
            date: m.date,
            platform: m.platform,
            followersCount: m.followersCount || 0,
            followingCount: m.followingCount || 0,
            postsCount: m.postsCount || 0,
            engagementRate: m.engagementRate || 0,
            reach: m.reach || 0,
            impressions: m.impressions || 0,
            watchTimeMinutes: m.watchTimeMinutes || null,
            avgViewDurationSeconds: m.avgViewDurationSeconds || null,
          },
        });
      }
      count++;
    } catch (e) {
      console.error("Error persisting social metric", e);
    }
  }
  return count;
}

// ---------------------------------------------------------------
// Log de sincronizacao
// ---------------------------------------------------------------

async function saveSyncLog(
  providerId: ProviderId,
  businessUnitId: string,
  result: SyncResult,
): Promise<void> {
  if (!prisma || !isDatabaseConnected()) return;

  const key = `analytics_${providerId}_last_sync`;
  const record: SyncLogRecord = {
    timestamp: new Date().toISOString(),
    status: result.status === "success" ? "success" : "error",
    error: result.errorMessage,
    metricsCount: result.metricsCount,
    duration: result.duration,
  };

  try {
    await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value: JSON.stringify(record) },
      update: { value: JSON.stringify(record) },
    });
  } catch (e) {
    console.error("Error saving sync log", e);
  }
}

// ---------------------------------------------------------------
// Retry com exponential backoff
// ---------------------------------------------------------------

async function fetchWithRetry(
  provider: AnalyticsProvider,
  businessUnitId: string,
  startDate: Date,
  endDate: Date,
): Promise<ProviderResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await provider.fetchMetrics(
        businessUnitId,
        startDate,
        endDate,
      );
      return result;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.error(
        `Sync attempt ${attempt + 1}/${MAX_RETRIES} failed for ${provider.providerId}:`,
        lastError.message,
      );
      if (attempt < MAX_RETRIES - 1) {
        const delayMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  return {
    metrics: [],
    fetchedAt: new Date(),
    isMock: false,
    warnings: [
      `Falha apos ${MAX_RETRIES} tentativas: ${lastError?.message || "erro desconhecido"}`,
    ],
  };
}

// ---------------------------------------------------------------
// Funcao principal de sincronizacao
// ---------------------------------------------------------------

export async function syncBusinessUnit(
  options: SyncOptions,
): Promise<SyncResult[]> {
  const registry = getProviderRegistry();
  const { businessUnitId, providerId, startDate, endDate } = options;

  const actualStart = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const actualEnd = endDate || new Date();

  const providers: AnalyticsProvider[] = providerId
    ? [registry.get(providerId)!].filter(Boolean)
    : await registry.listConfigured();

  if (providers.length === 0) {
    const mock = registry.get("mock");
    if (mock) providers.push(mock);
  }

  const results: SyncResult[] = [];

  for (const provider of providers) {
    const startTime = Date.now();
    const result: SyncResult = {
      providerId: provider.providerId,
      businessUnitId,
      status: "running",
      metricsCount: 0,
      duration: 0,
    };

    try {
      const providerResult = await fetchWithRetry(
        provider,
        businessUnitId,
        actualStart,
        actualEnd,
      );

      let metricsCount = 0;

      const trafficMetrics = providerResult.metrics.filter(
        (m) => m.pageViews !== undefined || m.sessions !== undefined,
      );
      const socialMetrics = providerResult.metrics.filter(
        (m) => m.platform !== undefined,
      );

      metricsCount += await persistTrafficMetrics(trafficMetrics);
      metricsCount += await persistSocialMetrics(socialMetrics);

      result.status = "success";
      result.metricsCount = metricsCount;
      result.duration = Date.now() - startTime;

      if (providerResult.warnings && providerResult.warnings.length > 0) {
        result.warnings = providerResult.warnings;
      }
    } catch (e) {
      result.status = "error";
      result.duration = Date.now() - startTime;
      result.errorMessage =
        e instanceof Error ? e.message : String(e);
    }

    results.push(result);
    await saveSyncLog(provider.providerId, businessUnitId, result);
  }

  return results;
}

export async function syncAllBusinessUnits(
  providerId?: ProviderId,
): Promise<SyncResult[][]> {
  let businessUnits: BusinessUnitLookup = [];

  if (prisma && isDatabaseConnected()) {
    try {
      businessUnits = await prisma.businessUnit.findMany({
        select: { id: true, slug: true },
      });
    } catch (e) {
      console.error("Error listing business units for sync", e);
    }
  }

  // Fallback: sem DB, nao ha unidades para sincronizar
  if (businessUnits.length === 0) {
    return [];
  }

  const allResults: SyncResult[][] = [];

  for (const bu of businessUnits) {
    const results = await syncBusinessUnit({
      businessUnitId: bu.id,
      providerId,
    });
    allResults.push(results);
  }

  return allResults;
}

export async function getSyncHistory(
  providerId?: ProviderId,
): Promise<SyncLogRecord[]> {
  if (!prisma || !isDatabaseConnected()) return [];

  const keys = providerId
    ? [`analytics_${providerId}_last_sync`]
    : [
        "analytics_google_analytics_last_sync",
        "analytics_meta_last_sync",
        "analytics_youtube_data_last_sync",
        "analytics_youtube_analytics_last_sync",
        "analytics_mock_last_sync",
      ];

  const records: SyncLogRecord[] = [];

  for (const key of keys) {
    try {
      const entry = await prisma.systemConfig.findUnique({
        where: { key },
      });
      if (entry?.value) {
        records.push(JSON.parse(entry.value) as SyncLogRecord);
      }
    } catch {
      // ignore
    }
  }

  return records;
}
