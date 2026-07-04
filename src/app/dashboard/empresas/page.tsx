import { auth } from "@/auth";
import { db } from "@/lib/db";
import EmpresasClient from "./EmpresasClient";

interface CompanyConfig {
  id: string;
  name: string;
  slug: string;
  color: string;
  holding?: string;
  isActive: boolean;
  showOnHome: boolean;
  order: number;
}

interface SystemPanel {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  minRole: string;
  minHierarchy: number;
  isActive: boolean;
  companySlug?: string | null;
}

export default async function EmpresasAdminPage() {
  const session = await auth();
  const currentUser = session?.user as
    | { role?: string; hierarchyLevel?: number }
    | undefined;

  const isLevel1 =
    currentUser?.hierarchyLevel === 1 || currentUser?.role === "ADMIN";

  // If not level 1, still render the client (it will show access denied)
  if (!isLevel1) {
    return <EmpresasClient isLevel1={false} companies={[]} panels={[]} />;
  }

  // Fetch data server-side in parallel
  const [companiesData, panelsData] = await Promise.all([
    db.getCompanies().catch(() => []),
    db.getPanels().catch(() => []),
  ]);

  const companies = (Array.isArray(companiesData) ? companiesData : []) as CompanyConfig[];
  const panels = (Array.isArray(panelsData) ? panelsData : []) as SystemPanel[];

  return (
    <EmpresasClient
      isLevel1={true}
      companies={companies}
      panels={panels}
    />
  );
}
