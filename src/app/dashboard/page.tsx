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
    name: "Grand Reserva",
    desc: "Lancamento de lotes exclusivos de alto padrao inserido no complexo Borgo del Vino.",
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
  const [logs, users, panels, docs, companiesData] = await Promise.all([
    db.getAuditLogs(userLevel, userCompany).catch(() => []),
    db.getUsers().catch(() => []),
    db.getPanels().catch(() => []),
    db.getDocuments(userLevel, userCompany).catch(() => []),
    db.getCompanies().catch(() => []),
  ]);

  const recentLogs = (
    logs as Array<{ id: string; userName: string; action: string; details: string; createdAt: Date }>
  ).slice(0, 4);

  const totalLogs = (logs as unknown[]).length;
  const activeUsers = (users as unknown[]).length;
  const totalSistemas = (panels as unknown[]).length;
  const totalDocs = (docs as unknown[]).length;

  let activeCompanies: DashboardCompany[] = fallbackCompanies;
  if (Array.isArray(companiesData) && companiesData.length > 0) {
    const filtered = (companiesData as DashboardCompany[])
      .filter((c) => c.isActive && c.showOnHome)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    if (filtered.length > 0) {
      activeCompanies = filtered;
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
