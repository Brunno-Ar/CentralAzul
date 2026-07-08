/**
 * Tipos e interfaces do modulo de Analytics
 *
 * Define a interface padrao que todos os providers devem implementar,
 * o modelo unificado de metricas, e os tipos de configuracao de
 * integracao. O restante do sistema consome dados atraves destas
 * interfaces, sem depender de APIs especificas.
 */

import type {
  BusinessUnitAnalytics,
  BusinessUnitMetaData,
  BusinessUnitRevenue,
} from "@/types/analytics";

// ---------------------------------------------------------------
// Identificadores de providers
// ---------------------------------------------------------------

export type ProviderId =
  | "google_analytics"
  | "meta"
  | "youtube_data"
  | "youtube_analytics"
  | "mock";

export type AuthMethod = "service_account" | "oauth" | "api_key" | "none";

// ---------------------------------------------------------------
// Modelo unificado de metricas
// ---------------------------------------------------------------

/**
 * Representa uma metrica unificada retornada por qualquer provider.
 * Cada campo e opcional pois nem todos providers fornecem todas as
 * metricas. O campo `source` identifica a origem (mock ou provider).
 */
export interface UnifiedAnalyticsMetric {
  businessUnitId: string;
  date: Date;
  source: ProviderId;
  // Metricas de trafego (Google Analytics)
  pageViews?: number;
  uniqueVisitors?: number;
  sessions?: number;
  bounceRate?: number;
  avgSessionDuration?: number;
  // Metricas de social (Meta, YouTube)
  platform?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  engagementRate?: number;
  reach?: number;
  impressions?: number;
  // Metricas de YouTube
  views?: number;
  subscribers?: number;
  videoCount?: number;
  watchTimeMinutes?: number;
  avgViewDurationSeconds?: number;
  // Metricas de receita
  revenue?: number;
  currency?: string;
}

/**
 * Resultado padrao de uma chamada de provider.
 * Pode conter dados de trafego, social metadata e/ou receita.
 */
export interface ProviderResult {
  metrics: UnifiedAnalyticsMetric[];
  /** Timestamp da ultima atualizacao bem-sucedida */
  fetchedAt: Date;
  /** Indica se os dados sao mock ou de API real */
  isMock: boolean;
  /** Mensagens de aviso ou limites encontrados */
  warnings?: string[];
}

// ---------------------------------------------------------------
// Interface base de providers
// ---------------------------------------------------------------

export interface ProviderConfig {
  providerId: ProviderId;
  displayName: string;
  authMethod: AuthMethod;
  /** Indica se o provider esta ativo/configurado */
  isEnabled: boolean;
  /** Ultima sincronizacao bem-sucedida */
  lastSyncAt: Date | null;
}

export interface ProviderStatus {
  providerId: ProviderId;
  displayName: string;
  isConfigured: boolean;
  isEnabled: boolean;
  lastSyncAt: Date | null;
  lastSyncStatus: "success" | "error" | "never";
  lastErrorMessage?: string;
}

/**
 * Interface que todos os providers devem implementar.
 * O sync.ts orquestra chamadas a estes metodos.
 */
export interface AnalyticsProvider {
  readonly providerId: ProviderId;
  readonly displayName: string;
  readonly authMethod: AuthMethod;

  /**
   * Verifica se as credenciais necessarias estao configuradas.
   * Nao faz chamadas de rede - apenas checa se as credenciais existem.
   */
  isConfigured(): Promise<boolean>;

  /**
   * Testa a conexao com a API externa.
   * Faz uma chamada leve para validar que as credenciais funcionam.
   * Retorna { success: boolean; message: string }
   */
  testConnection(): Promise<{ success: boolean; message: string }>;

  /**
   * Busca metricas para uma unidade de negocio em um periodo.
   * @param businessUnitId - ID da unidade
   * @param startDate - Data inicial (inclusive)
   * @param endDate - Data final (inclusive)
   */
  fetchMetrics(
    businessUnitId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ProviderResult>;

  /**
   * Retorna o status atual do provider.
   */
  getStatus(): Promise<ProviderStatus>;
}

// ---------------------------------------------------------------
// Tipos de credenciais
// ---------------------------------------------------------------

/**
 * Credenciais armazenadas para providers baseados em service account
 * (ex: Google Analytics). O conteudo e o JSON da service account
 * criptografado com AES-256-GCM.
 */
export interface ServiceAccountCredential {
  providerId: ProviderId;
  encryptedCredentials: string;
  propertyId?: string;
}

/**
 * Credenciais armazenadas para providers baseados em OAuth
 * (ex: Meta Graph, YouTube Analytics).
 * Os tokens sao criptografados com AES-256-GCM.
 */
export interface OAuthCredential {
  providerId: ProviderId;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  expiresAt: Date | null;
  scopes?: string[];
}

/**
 * Credenciais simples baseadas em API key.
 */
export interface ApiKeyCredential {
  providerId: ProviderId;
  encryptedApiKey: string;
}

export type Credential =
  | ServiceAccountCredential
  | OAuthCredential
  | ApiKeyCredential;

// ---------------------------------------------------------------
 // Registro central de providers
// ---------------------------------------------------------------

export interface ProviderRegistry {
  providers: Map<ProviderId, AnalyticsProvider>;
  register(provider: AnalyticsProvider): void;
  get(providerId: ProviderId): AnalyticsProvider | undefined;
  list(): AnalyticsProvider[];
  listConfigured(): Promise<AnalyticsProvider[]>;
}

// ---------------------------------------------------------------
// Tipos de sincronizacao
// ---------------------------------------------------------------

export type SyncStatus = "idle" | "running" | "success" | "error";

export interface SyncResult {
  providerId: ProviderId;
  businessUnitId: string;
  status: SyncStatus;
  metricsCount: number;
  duration: number;
  errorMessage?: string;
  warnings?: string[];
}

export interface SyncLogEntry {
  id: string;
  providerId: ProviderId;
  businessUnitId: string;
  status: SyncStatus;
  startedAt: Date;
  finishedAt: Date | null;
  metricsCount: number;
  errorMessage?: string;
  warnings?: string[];
}
