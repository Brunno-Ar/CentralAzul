import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import FerramentasClient from "./FerramentasClient";
import type { CompanyConfig } from "@/types/company";

interface SystemPanel {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  icon: string;
  category: string;
  minRole: string;
  minHierarchy: number;
  isActive: boolean;
  companySlug?: string | null;
  businessUnitToolId?: string | null;
  locked?: boolean;
}

interface BusinessUnitTool {
  id: string;
  businessUnitId: string;
  name: string;
  url: string;
  icon: string | null;
  description: string | null;
  category: string;
  isActive: boolean;
}

interface BusinessUnit {
  id: string;
  name: string;
  slug: string;
  company: string;
  tools?: BusinessUnitTool[];
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FerramentasPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userLevel = (session.user as { hierarchyLevel?: number }).hierarchyLevel || 3;

  // Fetch data directly from the database
  const [panelsData, companiesData, businessUnitsData] = await Promise.all([
    db.getPanels(),
    db.getCompanies(),
    db.getBusinessUnits(),
  ]);

  const allPanels: SystemPanel[] = panelsData || [];
  const businessUnits: BusinessUnit[] = businessUnitsData || [];

  // Merge business unit tools
  const syncedToolIds = new Set(
    allPanels
      .map((p) => p.businessUnitToolId)
      .filter((id): id is string => !!id),
  );

  for (const bu of businessUnits) {
    if (!bu.tools) continue;
    for (const tool of bu.tools) {
      if (syncedToolIds.has(tool.id)) continue;

      allPanels.push({
        id: `bu-tool-${tool.id}`,
        name: tool.name,
        description: tool.description,
        url: tool.url,
        icon: tool.icon || "ShieldAlert",
        category: bu.company,
        minRole: "VIEWER",
        minHierarchy: 3,
        isActive: tool.isActive,
        companySlug: bu.slug,
        businessUnitToolId: tool.id,
        locked: false,
      });
    }
  }

  // Crie conjuntos de IDs e Slugs válidos de empresas e unidades ativas
  const validBusinessUnitToolIds = new Set(
    businessUnits.flatMap((bu) => (bu.tools || []).map((t) => t.id))
  );
  const validBusinessUnitSlugs = new Set(
    businessUnits.map((bu) => bu.slug.toLowerCase())
  );
  const validCompanySlugs = new Set(
    companiesData?.map((c) => c.slug.toLowerCase()) || []
  );

  // Filtra painéis órfãos de unidades deletadas ou ferramentas excluídas
  const cleanPanels = allPanels.filter((panel) => {
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

  // Process panels: add locked flag and mask data for locked panels
  const processedPanels = cleanPanels.map((panel) => {
    const locked = userLevel > panel.minHierarchy;
    return {
      ...panel,
      locked,
      url: locked ? null : panel.url,
      description: locked ? "Acesso restrito" : panel.description,
    };
  });

  const companies: CompanyConfig[] = companiesData || [];

  // Read searchParams for initial company filter
  let initialCompanyFilter = "ALL";
  try {
    const params = await searchParams;
    const companyParam = params.company;
    if (typeof companyParam === "string") {
      const normalizedCompany = companyParam.toUpperCase();
      initialCompanyFilter = normalizedCompany === "COMP-GRAN-RESERVA"
        ? "BORGO"
        : normalizedCompany;
    }
  } catch {
    // ignore
  }

  return (
    <FerramentasClient
      initialPanels={processedPanels}
      companies={companies}
      businessUnits={businessUnits.map((bu) => ({
        id: bu.id,
        name: bu.name,
        slug: bu.slug,
        company: bu.company,
      }))}
      userLevel={userLevel}
      initialCompanyFilter={initialCompanyFilter}
    />
  );
}
