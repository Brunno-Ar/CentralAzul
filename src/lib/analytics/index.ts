/**
 * Analytics Module - Ponto de entrada
 *
 * Exporta tipos, interfaces, credencial store e o registro central de providers.
 * Os providers concretos (Google Analytics, Meta Graph, YouTube)
 * sao registrados aqui e consumidos pelo sync.ts.
 */

// Types
export type {
  ProviderId,
  AuthMethod,
  UnifiedAnalyticsMetric,
  ProviderResult,
  ProviderConfig,
  ProviderStatus,
  AnalyticsProvider,
  ServiceAccountCredential,
  OAuthCredential,
  ApiKeyCredential,
  Credential,
  ProviderRegistry,
  SyncStatus,
  SyncResult,
  SyncLogEntry,
} from "./types";

// Credential store
export {
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  isEncryptionConfigured,
} from "./credential-store";
export type { EncryptedPayload } from "./credential-store";

// Providers
export { googleAnalyticsProvider, saveGACredentials } from "./google-analytics";
export { metaGraphProvider, saveMetaCredentials } from "./meta-graph";
export { youTubeDataProvider, saveYouTubeDataCredentials } from "./youtube-data";
export {
  youTubeAnalyticsProvider,
  saveYouTubeAnalyticsCredentials,
} from "./youtube-analytics";
export { mockAnalyticsProvider, mulberry32, hashSeed } from "./mock-provider";

// Registry
export { createProviderRegistry, getProviderRegistry, getAllProviderStatuses } from "./registry";
