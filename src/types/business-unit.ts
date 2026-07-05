/**
 * Shared type definitions for Business Unit entities.
 * Used by both the list page and the detail page.
 */

export interface BusinessUnitTool {
  id: string;
  businessUnitId: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: string;
  isExternal: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessUnitSocialLink {
  id: string;
  businessUnitId: string;
  platform: string;
  url: string;
  handle: string;
  followersCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessUnitAnalytics {
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

export interface BusinessUnitMetaData {
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

export interface BusinessUnitRevenue {
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

export interface BusinessUnit {
  id: string;
  name: string;
  slug: string;
  company: string;
  description: string;
  logo: string;
  coverImage: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  tools: BusinessUnitTool[];
  socialLinks: BusinessUnitSocialLink[];
  analytics: BusinessUnitAnalytics[];
  metaData: BusinessUnitMetaData[];
  revenueData: BusinessUnitRevenue[];
}

/**
 * Formats a number into a compact string representation (e.g. 1.2K, 3.5M).
 */
export const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

/**
 * Returns the most recent meta data entry by date, or null if empty.
 */
export const getLatestMeta = (bu: BusinessUnit) => {
  if (!bu.metaData || !bu.metaData.length) return null;
  return bu.metaData.reduce((latest, current) =>
    new Date(current.date) > new Date(latest.date) ? current : latest,
  );
};

/**
 * Returns the first analytics entry (assumed to be the latest), or null if empty.
 */
export const getLatestAnalytics = (bu: BusinessUnit) => {
  if (!bu.analytics || !bu.analytics.length) return null;
  return bu.analytics[0];
};

/**
 * Returns the first revenue entry (assumed to be the latest), or null if empty.
 */
export const getLatestRevenue = (bu: BusinessUnit) => {
  if (!bu.revenueData || !bu.revenueData.length) return null;
  return bu.revenueData[0];
};
