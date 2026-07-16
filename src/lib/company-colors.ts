/**
 * Shared utility for company color mapping
 * Eliminates duplication between page.tsx and DashboardHomeClient.tsx
 */

import {
  Building2,
  Wine,
  GraduationCap,
} from "lucide-react";

export interface CompanyStyle {
  icon: typeof Building2;
  colorClass: string;
  accentClass: string;
}

export interface DashboardCompany {
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

// Icon mapping
const iconComponents = {
  Wine,
  GraduationCap,
  Building2,
} as const;

type IconName = keyof typeof iconComponents;

/**
 * Get company style configuration based on company data
 */
export function getCompanyStyle(company: DashboardCompany): CompanyStyle {
  // If explicit colorClass is provided, use it
  if (company.colorClass && company.accentClass) {
    const icon = company.iconName 
      ? (iconComponents[company.iconName as IconName] || Building2)
      : getIconByName(company.name, company.slug);
    
    return {
      icon,
      colorClass: company.colorClass,
      accentClass: company.accentClass,
    };
  }

  // Fallback based on color field
  const compColor = (company.color || "AZUL").toUpperCase();
  let colorClass = "from-brand-principal/20 to-brand-principal/40 border-brand-secundar/20";
  let accentClass = "text-brand-secundar";
  let icon = getIconByName(company.name, company.slug);

  switch (compColor) {
    case "WINE":
      colorClass = "from-brand-terciar/5 to-brand-terciar/15 border-brand-terciar/20";
      accentClass = "text-brand-terciar";
      break;
    case "RED":
      colorClass = "from-brand-secundar/5 to-brand-secundar/15 border-brand-secundar/20";
      accentClass = "text-brand-secundar";
      break;
    case "AZUL":
      colorClass = "from-brand-extra2/5 to-brand-extra2/15 border-brand-extra2/20";
      accentClass = "text-brand-extra2";
      break;
    case "GOLD":
      colorClass = "from-brand-principal/20 to-brand-principal/40 border-brand-secundar/20";
      accentClass = "text-brand-extra1";
      break;
    case "BRONZE":
      colorClass = "from-amber-700/5 to-amber-700/15 border-amber-700/20";
      accentClass = "text-amber-700";
      break;
    case "GREEN":
      colorClass = "from-emerald-700/5 to-emerald-700/15 border-emerald-700/20";
      accentClass = "text-emerald-700";
      break;
    case "BLUE":
      colorClass = "from-blue-600/5 to-blue-600/15 border-blue-600/20";
      accentClass = "text-blue-600";
      break;
    case "PURPLE":
      colorClass = "from-purple-600/5 to-purple-600/15 border-purple-600/20";
      accentClass = "text-purple-600";
      break;
  }

  return { icon, colorClass, accentClass };
}

/**
 * Detect icon based on company name/slug keywords
 */
function getIconByName(name?: string, slug?: string): typeof Building2 {
  const str = `${name || ""} ${slug || ""}`.toLowerCase();
  
  if (
    str.includes("wine") ||
    str.includes("vinho") ||
    str.includes("vinicola") ||
    str.includes("borgo") ||
    str.includes("reserva") ||
    str.includes("adega")
  ) {
    return Wine;
  }
  
  if (
    str.includes("bear") ||
    str.includes("maple") ||
    str.includes("school") ||
    str.includes("escola") ||
    str.includes("colegio") ||
    str.includes("educacao") ||
    str.includes("ensino")
  ) {
    return GraduationCap;
  }
  
  return Building2;
}

/**
 * Build DashboardCompany object with full styling
 * Used to transform business unit data into dashboard company format
 */
export function buildDashboardCompany(
  bu: {
    id?: string;
    name: string;
    slug: string;
    company: string;
    description?: string;
    iconName?: string;
    isActive: boolean;
    showOnHome: boolean;
    order: number;
    color?: string;
  },
  companiesList: Array<{ slug: string; color?: string }>,
  isGranReserva?: boolean
): DashboardCompany {
  const comp = companiesList.find((c) => c.slug === bu.company);
  const compColor = (comp?.color || bu.company).toUpperCase();

  const { icon, colorClass, accentClass } = getCompanyStyle({
    ...bu,
    color: compColor,
  });

  return {
    id: bu.id,
    name: bu.name,
    slug: bu.slug,
    color: bu.company,
    desc: bu.description,
    iconName: icon === Wine ? "Wine" : icon === GraduationCap ? "GraduationCap" : "Building2",
    colorClass,
    accentClass,
    url: isGranReserva
      ? "/dashboard/ferramentas?company=BORGO"
      : `/dashboard/ferramentas?company=${bu.company}`,
    isActive: bu.isActive,
    showOnHome: bu.showOnHome,
    order: bu.order,
  };
}

/**
 * Get fallback companies for when no business units are configured
 */
export function getFallbackCompanies(): DashboardCompany[] {
  return [
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
}
