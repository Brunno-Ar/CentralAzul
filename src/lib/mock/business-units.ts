import { Company } from "@prisma/client";
import type { MockBusinessUnit } from "../db";

export const mockBusinessUnits: MockBusinessUnit[] = globalThis.__mockBusinessUnits ?? (globalThis.__mockBusinessUnits = [
  {
    id: "bu-1",
    name: "Borgo del Vino",
    slug: "BORGO",
    company: Company.BORGO,
    description: "Primeiro condominio vinicola da Regiao Serrana e Sudeste.",
    logo: "",
    coverImage: "",
    address: "Estrada de Areal, Km 12 - Areal, RJ",
    phone: "(24) 2232-0024",
    email: "contato@borgodelvino.com.br",
    website: "https://borgodelvino.com.br",
    isActive: true,
    order: 1,
    showOnHome: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    tools: [],
    socialLinks: [],
    analytics: [],
    metaData: [],
    revenueData: [],
  },
]);
