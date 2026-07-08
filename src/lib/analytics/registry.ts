/**
 * Provider Registry
 *
 * Registro central de providers de analytics. Permite que o sync.ts
 * descubra e itere sobre todos os providers configurados de forma
 * uniforme, sem acoplar-se a imports diretos de cada implementacao.
 */

import type {
  AnalyticsProvider,
  ProviderId,
  ProviderRegistry,
  ProviderStatus,
} from "./types";
import { googleAnalyticsProvider } from "./google-analytics";
import { metaGraphProvider } from "./meta-graph";
import { youTubeDataProvider } from "./youtube-data";
import { youTubeAnalyticsProvider } from "./youtube-analytics";
import { mockAnalyticsProvider } from "./mock-provider";

/**
 * Cria e popula o registro central com todos os providers conhecidos.
 * O mock provider e sempre incluido como fallback.
 */
export function createProviderRegistry(): ProviderRegistry {
  const providers = new Map<ProviderId, AnalyticsProvider>();

  // Registrar todos os providers
  providers.set("google_analytics", googleAnalyticsProvider);
  providers.set("meta", metaGraphProvider);
  providers.set("youtube_data", youTubeDataProvider);
  providers.set("youtube_analytics", youTubeAnalyticsProvider);
  providers.set("mock", mockAnalyticsProvider);

  return {
    providers,

    register(provider: AnalyticsProvider): void {
      providers.set(provider.providerId, provider);
    },

    get(providerId: ProviderId): AnalyticsProvider | undefined {
      return providers.get(providerId);
    },

    list(): AnalyticsProvider[] {
      return Array.from(providers.values());
    },

    async listConfigured(): Promise<AnalyticsProvider[]> {
      const configured: AnalyticsProvider[] = [];
      for (const provider of providers.values()) {
        if (provider.providerId === "mock") continue; // Mock e sempre incluido separadamente
        const isConfigured = await provider.isConfigured();
        if (isConfigured) {
          configured.push(provider);
        }
      }
      return configured;
    },
  };
}

/**
 * Instancia singleton do registro.
 */
let _registry: ProviderRegistry | null = null;

export function getProviderRegistry(): ProviderRegistry {
  if (!_registry) {
    _registry = createProviderRegistry();
  }
  return _registry;
}

/**
 * Lista o status de todos os providers (incluindo mock).
 */
export async function getAllProviderStatuses(): Promise<ProviderStatus[]> {
  const registry = getProviderRegistry();
  const statuses: ProviderStatus[] = [];

  for (const provider of registry.list()) {
    statuses.push(await provider.getStatus());
  }

  return statuses;
}
