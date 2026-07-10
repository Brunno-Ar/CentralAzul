import { auth } from "@/auth";
import { db } from "@/lib/db";
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
        company?: string;
        status?: string;
      }
    | undefined;

  const userRole = user?.role || "VIEWER";
  const userLevel = user?.hierarchyLevel || 3;
  const userCompany = user?.company;

  // Fetch all dashboard data server-side in parallel
  const [logs, users, panels, docs, businessUnitsData, companiesList] = await Promise.all([
    db.getAuditLogs(userLevel, userCompany).catch(() => []),
    db.getUsers().catch(() => []),
    db.getPanels().catch(() => []),
    db.getDocuments(userLevel, userCompany).catch(() => []),
    db.getBusinessUnitsForHome().catch(() => []),
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
      const comp = companiesList.find((c) => c.slug === bu.company);
      const compColor = (comp?.color || bu.company).toUpperCase();

      // Mapeamento dinâmico de cores baseadas nas opções do EmpresasClient
      let colorClass = "from-brand-principal/20 to-brand-principal/40 border-brand-secundar/20";
      let accentClass = "text-brand-secundar";

      if (compColor === "WINE") {
        colorClass = "from-brand-terciar/5 to-brand-terciar/15 border-brand-terciar/20";
        accentClass = "text-brand-terciar";
      } else if (compColor === "RED") {
        colorClass = "from-brand-secundar/5 to-brand-secundar/15 border-brand-secundar/20";
        accentClass = "text-brand-secundar";
      } else if (compColor === "AZUL") {
        colorClass = "from-brand-extra2/5 to-brand-extra2/15 border-brand-extra2/20";
        accentClass = "text-brand-extra2";
      } else if (compColor === "GOLD") {
        colorClass = "from-brand-principal/20 to-brand-principal/40 border-brand-secundar/20";
        accentClass = "text-brand-extra1";
      } else if (compColor === "BRONZE") {
        colorClass = "from-amber-700/5 to-amber-700/15 border-amber-700/20";
        accentClass = "text-amber-700";
      } else if (compColor === "GREEN") {
        colorClass = "from-emerald-700/5 to-emerald-700/15 border-emerald-700/20";
        accentClass = "text-emerald-700";
      } else if (compColor === "BLUE") {
        colorClass = "from-blue-600/5 to-blue-600/15 border-blue-600/20";
        accentClass = "text-blue-600";
      } else if (compColor === "PURPLE") {
        colorClass = "from-purple-600/5 to-purple-600/15 border-purple-600/20";
        accentClass = "text-purple-600";
      }

      // Detecção inteligente de ícones baseada em palavras-chave no nome ou slug
      const str = `${bu.name} ${bu.slug}`.toLowerCase();
      let iconName = "Building2";
      if (
        str.includes("wine") ||
        str.includes("vinho") ||
        str.includes("vinicola") ||
        str.includes("reserva") ||
        str.includes("adega") ||
        str.includes("borgo")
      ) {
        iconName = "Wine";
      } else if (
        str.includes("bear") ||
        str.includes("maple") ||
        str.includes("school") ||
        str.includes("escola") ||
        str.includes("colegio") ||
        str.includes("educacao") ||
        str.includes("ensino")
      ) {
        iconName = "GraduationCap";
      }

      const isGranReserva = bu.slug === "COMP-GRAN-RESERVA";
      return {
        id: bu.id,
        name: bu.name,
        slug: bu.slug,
        color: bu.company,
        desc: bu.description || undefined,
        iconName,
        colorClass,
        accentClass,
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
