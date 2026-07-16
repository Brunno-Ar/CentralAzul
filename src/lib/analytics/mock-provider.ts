/**
 * Mock Analytics Provider
 *
 * Provider de dados simulados para uso quando nenhum provider real
 * esta configurado. Substitui o uso de Math.random() no
 * syncBusinessUnitData do db.ts por um PRNG seeded (mulberry32)
 * para gerar dados deterministicos e consistentes entre execucoes.
 *
 * Os dados sao marcados com source="mock" para identificar claramente
 * que nao sao de API real.
 */

import type {
  AnalyticsProvider,
  ProviderResult,
  ProviderStatus,
  UnifiedAnalyticsMetric,
} from "./types";

const PROVIDER_ID = "mock" as const;
const DISPLAY_NAME = "Dados Simulados";

// ---------------------------------------------------------------
// PRNG seeded (mulberry32)
// ---------------------------------------------------------------

/**
 * Gerador de numeros pseudo-aleatorios deterministico.
 * Cada seed produz a mesma sequencia de valores, garantindo
 * consistencia dos dados mock entre execucoes.
 */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash simples de string para seed numerico.
 */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Gerar numero inteiro no range [min, max] com deterministicidade.
 */
function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Gerar numero float no range [min, max].
 */
function randFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

// ---------------------------------------------------------------
// Dados base por plataforma (valores fixos, sem aleatoriedade)
// ---------------------------------------------------------------

const BASE_FOLLOWERS: Record<string, number> = {
  instagram: 12500,
  youtube: 4300,
  facebook: 8200,
  linkedin: 3100,
};

const BASE_RANGE: Record<string, number> = {
  instagram: 5000,
  youtube: 1500,
  facebook: 2000,
  linkedin: 1000,
};

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

class MockAnalyticsProvider implements AnalyticsProvider {
  readonly providerId = PROVIDER_ID;
  readonly displayName = DISPLAY_NAME;
  readonly authMethod = "none" as const;

  async isConfigured(): Promise<boolean> {
    return true; // Mock esta sempre "configurado"
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: "Provider de dados simulados ativo",
    };
  }

  async fetchMetrics(
    businessUnitId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ProviderResult> {
    const seed = hashSeed(businessUnitId);

    const metrics: UnifiedAnalyticsMetric[] = [];

    // Metricas de trafego (Google Analytics simulado) por dia
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);

      // Variacao deterministica por dia (seed desloca a cada iteracao)
      const dailyRng = mulberry32(seed + i * 1000);

      const metric: UnifiedAnalyticsMetric = {
        businessUnitId,
        date,
        source: PROVIDER_ID,
        pageViews: randInt(dailyRng, 1500, 4000),
        uniqueVisitors: randInt(dailyRng, 1100, 2900),
        sessions: randInt(dailyRng, 1200, 3200),
        bounceRate: Math.round(randFloat(dailyRng, 35, 55) * 100) / 100,
        avgSessionDuration: randInt(dailyRng, 90, 240),
      };

      metrics.push(metric);
    }

    // Metricas de social (Meta simulado) - snapshot por dia
    const platforms = ["instagram", "facebook"] as const;
    for (const platform of platforms) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      const platformSeed = hashSeed(businessUnitId + platform);
      const platformRng = mulberry32(platformSeed);

      const base = BASE_FOLLOWERS[platform] || 5000;
      const range = BASE_RANGE[platform] || 1000;

      const followersCount = base + Math.floor(platformRng() * range);
      const reach = Math.floor(followersCount * randFloat(platformRng, 0.15, 0.40));
      const impressions = Math.floor(reach * randFloat(platformRng, 1.2, 2.0));

      metrics.push({
        businessUnitId,
        date,
        source: PROVIDER_ID,
        platform,
        followersCount,
        followingCount: randInt(platformRng, 200, 250),
        postsCount: randInt(platformRng, 45, 60),
        engagementRate: Math.round(randFloat(platformRng, 1.8, 6.3) * 100) / 100,
        reach,
        impressions,
      });
    }

    // Metricas de YouTube (simulado)
    const ytSeed = hashSeed(businessUnitId + "youtube");
    const ytRng = mulberry32(ytSeed);

    metrics.push({
      businessUnitId,
      date: new Date(),
      source: PROVIDER_ID,
      platform: "youtube",
      subscribers: 4300 + Math.floor(ytRng() * 1500),
      views: 125000 + Math.floor(ytRng() * 50000),
      videoCount: 45 + Math.floor(ytRng() * 15),
      watchTimeMinutes: 15000 + Math.floor(ytRng() * 8000),
      avgViewDurationSeconds: 180 + Math.floor(ytRng() * 120),
    });

    return {
      metrics,
      fetchedAt: new Date(),
      isMock: true,
      warnings: [
        "Dados simulados (mock). Configure um provider real para dados autenticos.",
      ],
    };
  }

  async getStatus(): Promise<ProviderStatus> {
    return {
      providerId: PROVIDER_ID,
      displayName: DISPLAY_NAME,
      isConfigured: true,
      isEnabled: true,
      lastSyncAt: null,
      lastSyncStatus: "never",
    };
  }
}

// Singleton
export const mockAnalyticsProvider = new MockAnalyticsProvider();
export { mulberry32, hashSeed };
