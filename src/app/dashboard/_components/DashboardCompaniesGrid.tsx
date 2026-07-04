"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Building2, Wine, GraduationCap } from "lucide-react";

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

function getCompanyStyle(c: DashboardCompany) {
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
      return {
        icon: Wine,
        color: "from-brand-terciar/5 to-brand-terciar/15 border-brand-terciar/20",
        accent: "text-brand-terciar",
        url,
        desc,
      };
    case "MAPLE_BEAR":
      return {
        icon: GraduationCap,
        color: "from-brand-secundar/5 to-brand-secundar/15 border-brand-secundar/20",
        accent: "text-brand-secundar",
        url,
        desc,
      };
    case "AZUL":
      return {
        icon: Building2,
        color: "from-brand-extra2/5 to-brand-extra2/15 border-brand-extra2/20",
        accent: "text-brand-extra2",
        url,
        desc,
      };
    default:
      return {
        icon: Building2,
        color: "from-brand-principal/20 to-brand-principal/40 border-brand-secundar/20",
        accent: "text-brand-secundar",
        url,
        desc,
      };
  }
}

export function DashboardCompaniesGrid({ companies }: { companies: DashboardCompany[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {companies.map((company, idx) => {
        const style = getCompanyStyle(company);
        const Icon = style.icon;
        return (
          <Link href={style.url} key={company.name} className="block">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, type: "spring" as const }}
              className={`flex flex-col justify-between p-5 rounded-2xl border bg-gradient-to-br ${style.color} shadow-sm transition-all hover:shadow-md hover:border-brand-secundar/40 hover:-translate-y-0.5 cursor-pointer h-full`}
            >
              <div>
                <div className="flex items-center justify-between w-full mb-4">
                  <span className="text-sm font-bold text-brand-extra1">{company.name}</span>
                  <div className={`p-2 rounded-lg bg-white/80 shadow-sm ${style.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-brand-terciar/80 leading-relaxed">
                  {style.desc}
                </p>
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
