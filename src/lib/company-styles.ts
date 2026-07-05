import type { LucideIcon } from "lucide-react";
import { Building2, GraduationCap, Wine } from "lucide-react";

/* ============================================================
   SHARED COMPANY STYLE CONSTANTS
   ============================================================ */

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

export interface CompanyStyle {
  icon: LucideIcon;
  color: string;
  accent: string;
  url: string;
  desc: string;
}

export const companyColors: Record<string, string> = {
  BORGO: "text-brand-terciar bg-brand-terciar/10 border-brand-terciar/30",
  MAPLE_BEAR: "text-brand-secundar bg-brand-secundar/10 border-brand-secundar/30",
  AZUL: "text-brand-extra2 bg-brand-extra2/10 border-brand-extra2/30",
  CENTRAL: "text-brand-extra1 bg-brand-principal/20 border-brand-secundar/30",
};

export const companyLabels: Record<string, string> = {
  BORGO: "Borgo del Vin",
  MAPLE_BEAR: "Maple Bear",
  AZUL: "Azul Incorporações",
  CENTRAL: "Central / Geral",
};

/* ============================================================
   COMPANY STYLE HELPER
   ============================================================ */

export const getCompanyStyle = (c: DashboardCompany): CompanyStyle => {
  if (c.colorClass) {
    return {
      icon: c.iconName === "Wine" ? Wine : c.iconName === "GraduationCap" ? GraduationCap : Building2,
      color: c.colorClass,
      accent: c.accentClass || "text-brand-secundar",
      url: c.url || "/dashboard/ferramentas",
      desc: c.desc || "",
    };
  }

  const type = (c.color || "AZUL").toUpperCase();
  const url = `/dashboard/ferramentas?company=${c.slug}`;
  const desc = `Painel corporativo e ferramentas integradas da divisao ${c.name}.`;

  switch (type) {
    case "BORGO":
      return { icon: Wine, color: "from-amber-50 to-amber-100 border-amber-200", accent: "text-amber-700", url, desc };
    case "MAPLE_BEAR":
      return { icon: GraduationCap, color: "from-emerald-50 to-emerald-100 border-emerald-200", accent: "text-emerald-700", url, desc };
    case "AZUL":
      return { icon: Building2, color: "from-sky-50 to-sky-100 border-sky-200", accent: "text-sky-700", url, desc };
    default:
      return { icon: Building2, color: "from-gray-50 to-gray-100 border-gray-200", accent: "text-gray-700", url, desc };
  }
};
