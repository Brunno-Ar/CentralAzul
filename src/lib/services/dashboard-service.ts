/**
 * Dashboard Service Layer
 * Contains business logic for dashboard data processing
 * Separated from page components for better testability and maintainability
 */

import { db } from "@/lib/db";

export interface DashboardDataParams {
  userLevel: number;
  userCompany?: string | null;
}

export interface DashboardStats {
  totalSistemas: number;
  totalLogs: number;
  totalDocs: number;
  activeUsers: number;
}

export interface AuditLogEntry {
  id: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DashboardCompanyData {
  id?: string;
  name: string;
  slug?: string;
  color?: string;
  desc?: string;
  iconName?: string;
  colorClass?: string;
  accentClass?: string;
  url?: string;
  isActive?: boolean;
  showOnHome?: boolean;
  order?: number;
}

/**
 * Fetch and process all dashboard data
 * Returns structured data for the dashboard client component
 */
export async function getDashboardData(params: DashboardDataParams): Promise<{
  stats: DashboardStats;
  recentLogs: AuditLogEntry[];
  companies: DashboardCompanyData[];
}> {
  const { userLevel, userCompany } = params;

  // Convert null to undefined for db functions
  const companyParam = userCompany ?? undefined;

  // Fetch all dashboard data server-side in parallel
  const [logs, users, panelsData, docs, businessUnitsData, companiesList] = await Promise.all([
    db.getAuditLogs(userLevel, companyParam).catch(() => []),
    db.getUsers().catch(() => []),
    db.getPanels().catch(() => []),
    db.getDocuments(userLevel, companyParam).catch(() => []),
    db.getBusinessUnits().catch(() => []),
    db.getCompanies().catch(() => []),
  ]);

  // Process recent logs (last 4)
  const recentLogs: AuditLogEntry[] = (logs as any[] || [])
    .slice(0, 4)
    .map((log) => ({
      id: log.id,
      userName: log.userName,
      action: log.action,
      details: log.details,
      createdAt: new Date(log.createdAt).toISOString(),
    }));

  // Calculate stats
  const totalLogs = (logs as unknown[]).length;
  const activeUsers = (users as unknown[]).length;
  const totalDocs = (docs as unknown[]).length;

  // Filter orphaned tools and unify business unit tools
  const validBusinessUnitToolIds = new Set(
    (businessUnitsData as any[] || []).flatMap((bu) => (bu.tools || []).map((t: any) => t.id))
  );
  const validBusinessUnitSlugs = new Set(
    (businessUnitsData as any[] || []).map((bu) => bu.slug.toLowerCase())
  );
  const validCompanySlugs = new Set(
    (companiesList || []).map((c) => c.slug.toLowerCase())
  );

  const cleanPanels = (panelsData as any[] || []).filter((panel) => {
    if (panel.businessUnitToolId && !validBusinessUnitToolIds.has(panel.businessUnitToolId)) {
      return false;
    }
    if (panel.companySlug) {
      const slugLower = panel.companySlug.toLowerCase();
      if (slugLower.startsWith("comp-") && !validBusinessUnitSlugs.has(slugLower)) {
        return false;
      }
      if (!validCompanySlugs.has(slugLower) && !validBusinessUnitSlugs.has(slugLower)) {
        return false;
      }
    }
    return true;
  });

  const syncedToolIds = new Set(
    cleanPanels
      .map((p) => p.businessUnitToolId)
      .filter((id): id is string => !!id),
  );

  let unlistedBuToolsCount = 0;
  for (const bu of (businessUnitsData as any[] || [])) {
    if (!bu.tools) continue;
    for (const tool of bu.tools) {
      if (!syncedToolIds.has(tool.id)) {
        unlistedBuToolsCount++;
      }
    }
  }

  const totalSistemas = cleanPanels.length + unlistedBuToolsCount;

  // Build companies using shared utility
  const { getFallbackCompanies, buildDashboardCompany } = await import("@/lib/company-colors");

  let activeCompanies = getFallbackCompanies();
  if (Array.isArray(businessUnitsData) && businessUnitsData.length > 0) {
    const homeUnits = (businessUnitsData as any[]).filter(bu => bu.isActive && bu.showOnHome);
    const mappedCompanies = homeUnits.map((bu) => 
      buildDashboardCompany(bu, companiesList, bu.slug === "COMP-GRAN-RESERVA")
    );
    if (mappedCompanies.length > 0) {
      activeCompanies = mappedCompanies;
    }
  }

  return {
    stats: {
      totalSistemas,
      totalLogs,
      totalDocs,
      activeUsers,
    },
    recentLogs,
    companies: activeCompanies,
  };
}
