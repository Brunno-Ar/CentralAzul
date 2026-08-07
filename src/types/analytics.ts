/**
 * Tipos compartilhados de Analytics
 *
 * Centraliza todas as interfaces de dados de analytics que antes estavam
 * duplicadas em multiplos arquivos de pagina. Os tipos aqui usam Date
 * (compativel com o retorno do Prisma). Paginas que serializam para o
 * cliente convertem Date -> string via toISOString().
 */

// ---------------------------------------------------------------
// Modelos de banco (espelham os modelos Prisma)
// ---------------------------------------------------------------

export interface BusinessUnitAnalytics {
  id: string;
  businessUnitId: string;
  date: Date;
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
  source: string;
  createdAt: Date;
}

export interface BusinessUnitMetaData {
  id: string;
  businessUnitId: string;
  date: Date;
  platform: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  createdAt: Date;
}

export interface BusinessUnitRevenue {
  id: string;
  businessUnitId: string;
  period: string;
  amount: number;
  currency: string;
  type: string;
  source: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------
// Versoes serializadas (para client components)
// ---------------------------------------------------------------

export interface BusinessUnitAnalyticsSerialized {
  id: string;
  businessUnitId: string;
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
  source: string;
  createdAt: string;
}

export interface BusinessUnitMetaDataSerialized {
  id: string;
  businessUnitId: string;
  date: string;
  platform: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  createdAt: string;
}

export interface BusinessUnitRevenueSerialized {
  id: string;
  businessUnitId: string;
  period: string;
  amount: number;
  currency: string;
  type: string;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------
// Helpers de serializacao
// ---------------------------------------------------------------

export function serializeAnalytics(
  data: BusinessUnitAnalytics,
): BusinessUnitAnalyticsSerialized {
  return {
    id: data.id,
    businessUnitId: data.businessUnitId,
    date: data.date instanceof Date ? data.date.toISOString() : data.date,
    pageViews: data.pageViews,
    uniqueVisitors: data.uniqueVisitors,
    sessions: data.sessions,
    bounceRate: data.bounceRate,
    avgSessionDuration: data.avgSessionDuration,
    source: data.source,
    createdAt:
      data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : data.createdAt,
  };
}

export function serializeMetaData(
  data: BusinessUnitMetaData,
): BusinessUnitMetaDataSerialized {
  return {
    id: data.id,
    businessUnitId: data.businessUnitId,
    date: data.date instanceof Date ? data.date.toISOString() : data.date,
    platform: data.platform,
    followersCount: data.followersCount,
    followingCount: data.followingCount,
    postsCount: data.postsCount,
    engagementRate: data.engagementRate,
    reach: data.reach,
    impressions: data.impressions,
    createdAt:
      data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : data.createdAt,
  };
}

export function serializeRevenue(
  data: BusinessUnitRevenue,
): BusinessUnitRevenueSerialized {
  return {
    id: data.id,
    businessUnitId: data.businessUnitId,
    period: data.period,
    amount: data.amount,
    currency: data.currency,
    type: data.type,
    source: data.source,
    notes: data.notes,
    createdAt:
      data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : data.createdAt,
    updatedAt:
      data.updatedAt instanceof Date
        ? data.updatedAt.toISOString()
        : data.updatedAt,
  };
}
