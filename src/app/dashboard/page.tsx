import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Company } from "@prisma/client";
import DashboardHomeClient from "./DashboardHomeClient";

interface DashboardCompany {
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

const fallbackCompanies: DashboardCompany[] = [
  {
    name: "Borgo del Vino",
    desc: "Hospedagem, hotel e vinicola de alto padrao que traz um pedaco da cultura italiana para o Brasil.",
    iconName: "Wine",
    colorClass: "from-brand-terciar/5 to-brand-terciar/15 border-brand-terciar/20",
    accentClass: "text-brand-terciar",
    url: "/dashboard/ferramentas?company=BORGO",
  },
  {
    name: "Gran Reserva",
    desc: "Lançamento de lotes exclusivos de alto padrão inserido no complexo Borgo del Vino.",
    iconName: "Wine",
    colorClass: "from-brand-extra3/5 to-brand-extra3/15 border-brand-extra3/20",
    accentClass: "text-brand-extra3",
    url: "/dashboard/ferramentas?company=BORGO",
  },
  {
    name: "Maple Bear",
    desc: "Rede de ensino bilingue com metodologia canadense focada no desenvolvimento critico.",
    iconName: "GraduationCap",
    colorClass: "from-brand-secundar/5 to-brand-secundar/15 border-brand-secundar/20",
    accentClass: "text-brand-secundar",
    url: "/dashboard/ferramentas?company=MAPLE_BEAR",
  },
  {
    name: "Azul Incorporacoes",
    desc: "Incorporadora de alto padrao com portfolio de condominios de luxo e prontos para morar.",
    iconName: "Building2",
    colorClass: "from-brand-extra2/5 to-brand-extra2/15 border-brand-extra2/20",
    accentClass: "text-brand-extra2",
    url: "/dashboard/ferramentas?company=AZUL",
  },
];

export default async function DashboardHome() {
  const session = await auth();
  const user = session?.user as
    | {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
        hierarchyLevel?: number;
        company?: Company;
        status?: string;
      }
    | undefined;

  const userRole = user?.role || "VIEWER";
  const userLevel = user?.hierarchyLevel || 3;
  const userCompany = user?.company;

  // Fetch all dashboard data server-side in parallel
  const [logs, users, panels, docs, businessUnitsData] = await Promise.all([
    db.getAuditLogs(userLevel, userCompany).catch(() => []),
    db.getUsers().catch(() => []),
    db.getPanels().catch(() => []),
    db.getDocuments(userLevel, userCompany).catch(() => []),
    db.getBusinessUnitsForHome().catch(() => []),
  ]);

  const recentLogs = (
    logs as Array<{ id: string; userName: string; action: string; details: string; createdAt: Date }>
  ).slice(0, 4);

  const totalLogs = (logs as unknown[]).length;
  const activeUsers = (users as unknown[]).length;
  const totalSistemas = (panels as unknown[]).length;
  const totalDocs = (docs as unknown[]).length;

  let activeCompanies: DashboardCompany[] = fallbackCompanies;
  if (Array.isArray(businessUnitsData) && businessUnitsData.length > 0) {
    const mappedCompanies: DashboardCompany[] = (businessUnitsData as Array<{
      id: string;
      name: string;
      slug: string;
      company: string;
      description: string | null;
      order: number;
      isActive: boolean;
      showOnHome: boolean;
    }>).map((bu) => {
      const iconMap: Record<string, string> = {
        BORGO: "Wine",
        MAPLE_BEAR: "GraduationCap",
        AZUL: "Building2",
        CENTRAL: "Building2",
      };
      const colorClassMap: Record<string, string> = {
        BORGO: "from-brand-terciar/5 to-brand-terciar/15 border-brand-terciar/20",
        MAPLE_BEAR: "from-brand-secundar/5 to-brand-secundar/15 border-brand-secundar/20",
        AZUL: "from-brand-extra2/5 to-brand-extra2/15 border-brand-extra2/20",
        CENTRAL: "from-brand-terciar/5 to-brand-terciar/15 border-brand-terciar/20",
      };
      const accentClassMap: Record<string, string> = {
        BORGO: "text-brand-terciar",
        MAPLE_BEAR: "text-brand-secundar",
        AZUL: "text-brand-extra2",
        CENTRAL: "text-brand-terciar",
      };
      const isGranReserva = bu.slug === "COMP-GRAN-RESERVA";
      return {
        id: bu.id,
        name: bu.name,
        slug: bu.slug,
        color: bu.company,
        desc: bu.description || undefined,
        iconName: iconMap[bu.company] || "Building2",
        colorClass: colorClassMap[bu.company] || "from-brand-principal/20 to-brand-principal/40 border-brand-secundar/20",
        accentClass: accentClassMap[bu.company] || "text-brand-secundar",
        url: isGranReserva ? "/dashboard/ferramentas?company=BORGO" : `/dashboard/ferramentas?company=${bu.company}`,
        isActive: bu.isActive,
        showOnHome: bu.showOnHome,
        order: bu.order,
      };
    });
    if (mappedCompanies.length > 0) {
      activeCompanies = mappedCompanies;
    }
  }

  return (
    <DashboardHomeClient
      userName={user?.name}
      userRole={userRole}
      userLevel={userLevel}
      stats={{
        totalSistemas,
        totalLogs,
        totalDocs,
        activeUsers,
      }}
      recentLogs={recentLogs.map((log) => ({
        id: log.id,
        userName: log.userName,
        action: log.action,
        details: log.details,
        createdAt: new Date(log.createdAt).toISOString(),
      }))}
      companies={activeCompanies}
    />
  );
}
