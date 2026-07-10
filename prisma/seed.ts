import { prisma } from "../src/lib/db";

type AggregatingUnit = {
  slug: string;
  name: string;
  company: string;
  description: string;
  showOnHome: boolean;
  order: number;
};

const aggregatingUnits: AggregatingUnit[] = [
  {
    slug: "BORGO",
    name: "Borgo del Vino",
    company: "BORGO",
    description: "Primeiro condomínio vinícola da Região Serrana e Sudeste. Inspirado nas vilas da Toscana, integrando vinhedos próprios, hotel boutique, spa, enoteca e restaurante em um cenário espetacular.",
    showOnHome: true,
    order: 1,
  },
  {
    slug: "MAPLE_BEAR",
    name: "Maple Bear",
    company: "MAPLE_BEAR",
    description: "Rede de ensino bilíngue com metodologia canadense focada no desenvolvimento crítico.",
    showOnHome: true,
    order: 2,
  },
  {
    slug: "AZUL",
    name: "Grupo Azul",
    company: "AZUL",
    description: "Incorporadora de alto padrão com portfólio de condomínios de luxo e prontos para morar.",
    showOnHome: true,
    order: 3,
  },
  {
    slug: "COMP-GRAN-RESERVA",
    name: "Gran Reserva",
    company: "BORGO",
    description: "Lançamento de lotes exclusivos de alto padrão inserido no complexo Borgo del Vino.",
    showOnHome: true,
    order: 4,
  },
];

const seedCompanies = [
  { name: "Borgo del Vino", slug: "BORGO", color: "WINE", holding: "CENTRAL", isActive: true, showOnHome: true, order: 1 },
  { name: "Maple Bear", slug: "MAPLE_BEAR", color: "RED", holding: "CENTRAL", isActive: true, showOnHome: true, order: 2 },
  { name: "Grupo Azul", slug: "AZUL", color: "AZUL", holding: "CENTRAL", isActive: true, showOnHome: true, order: 3 },
  { name: "Central", slug: "CENTRAL", color: "GOLD", holding: null, isActive: true, showOnHome: true, order: 4 },
];

const seedLevels = [
  { level: 1, name: "Direcao Geral" },
  { level: 2, name: "Gerencia / Coordenacao" },
  { level: 3, name: "Operacional" },
];

const seedMenuPermissions = [
  { href: "/dashboard", name: "Painel Principal", minLevel: 3, icon: "Grid", order: 1, isActive: true },
  { href: "/dashboard/ferramentas", name: "Ferramentas", minLevel: 3, icon: "Sliders", order: 2, isActive: true },
  { href: "/dashboard/comunicados", name: "Comunicados", minLevel: 3, icon: "Bell", order: 3, isActive: true },
  { href: "/dashboard/unidades", name: "Unidades de Negocio", minLevel: 3, icon: "Building2", order: 4, isActive: true },
  { href: "/dashboard/metricas", name: "Metricas", minLevel: 3, icon: "BarChart3", order: 5, isActive: true },
  { href: "/dashboard/documentos", name: "Drive de Arquivos", minLevel: 3, icon: "FileText", order: 6, isActive: true },
  { href: "/dashboard/atividades", name: "Atividades", minLevel: 3, icon: "Activity", order: 7, isActive: true },
  { href: "/dashboard/seguranca", name: "Seguranca & Niveis", minLevel: 1, icon: "ShieldAlert", order: 8, isActive: true },
  { href: "/dashboard/configuracoes", name: "Configuracoes", minLevel: 99, icon: "Sliders", order: 9, isActive: true },
];

const seedRolePermissions = [
  { role: "ADMIN", action: "role:configure" },
  { role: "ADMIN", action: "panel:create" },
  { role: "ADMIN", action: "system-config:write" },
  { role: "COORDINATOR", action: "document:upload" },
  { role: "COORDINATOR", action: "announcement:create" },
  { role: "COORDINATOR", action: "panel:view" },
  { role: "VIEWER", action: "panel:view" },
  { role: "VIEWER", action: "announcement:read" },
  { role: "VIEWER", action: "document:view" },
];

const seedSystemConfigs = [
  { key: "restrictDomain", value: "" },
  { key: "mfaRequired", value: "false" },
  { key: "sessionMaxAge", value: "86400" },
  { key: "lockoutThreshold", value: "5" },
  { key: "lockoutDurationMs", value: "900000" },
  { key: "maxFileSizeBytes", value: "10737418240" },
  { key: "defaultRole", value: "VIEWER" },
];

const seedDocumentTypes = [
  { name: "pdf", icon: "FileText", isActive: true },
  { name: "link", icon: "Link2", isActive: true },
  { name: "video", icon: "Video", isActive: true },
  { name: "sharepoint", icon: "Share2", isActive: true },
];

async function main() {
  for (const comp of seedCompanies) {
    try {
      await prisma.company.upsert({
        where: { slug: comp.slug },
        update: {
          name: comp.name,
          color: comp.color,
          holding: comp.holding,
          isActive: comp.isActive,
          showOnHome: comp.showOnHome,
          order: comp.order,
        },
        create: {
          name: comp.name,
          slug: comp.slug,
          color: comp.color,
          holding: comp.holding,
          isActive: comp.isActive,
          showOnHome: comp.showOnHome,
          order: comp.order,
        },
      });
      console.log(`Seed: upsert OK for company ${comp.name} (${comp.slug})`);
    } catch (e) {
      console.error(`Seed: failed for company ${comp.name} (${comp.slug})`, e);
    }
  }

  for (const unit of aggregatingUnits) {
    try {
      await prisma.businessUnit.upsert({
        where: { slug: unit.slug },
        update: {
          name: unit.name,
          company: unit.company,
          description: unit.description,
          showOnHome: unit.showOnHome,
          order: unit.order,
        },
        create: {
          slug: unit.slug,
          name: unit.name,
          company: unit.company,
          description: unit.description,
          showOnHome: unit.showOnHome,
          isActive: true,
          order: unit.order,
        },
      });
      console.log(`Seed: upsert OK for ${unit.name} (${unit.slug})`);
    } catch (e) {
      console.error(`Seed: failed for ${unit.name} (${unit.slug})`, e);
    }
  }

  for (const lvl of seedLevels) {
    try {
      await prisma.levelConfig.upsert({
        where: { level: lvl.level },
        update: { name: lvl.name },
        create: { level: lvl.level, name: lvl.name },
      });
      console.log(`Seed: upsert OK for level ${lvl.level} (${lvl.name})`);
    } catch (e) {
      console.error(`Seed: failed for level ${lvl.level}`, e);
    }
  }

  for (const perm of seedMenuPermissions) {
    try {
      await prisma.menuPermission.upsert({
        where: { href: perm.href },
        update: {
          name: perm.name,
          minLevel: perm.minLevel,
          icon: perm.icon,
          order: perm.order,
          isActive: perm.isActive,
        },
        create: {
          href: perm.href,
          name: perm.name,
          minLevel: perm.minLevel,
          icon: perm.icon,
          order: perm.order,
          isActive: perm.isActive,
        },
      });
      console.log(`Seed: upsert OK for menu permission ${perm.href}`);
    } catch (e) {
      console.error(`Seed: failed for menu permission ${perm.href}`, e);
    }
  }

  for (const rp of seedRolePermissions) {
    try {
      await prisma.rolePermission.upsert({
        where: {
          role_action: {
            role: rp.role,
            action: rp.action,
          },
        },
        update: {},
        create: {
          role: rp.role,
          action: rp.action,
        },
      });
      console.log(`Seed: upsert OK for RolePermission ${rp.role} -> ${rp.action}`);
    } catch (e) {
      console.error(`Seed: failed for RolePermission ${rp.role} -> ${rp.action}`, e);
    }
  }

  for (const config of seedSystemConfigs) {
    try {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { value: config.value },
        create: { key: config.key, value: config.value },
      });
      console.log(`Seed: upsert OK for SystemConfig ${config.key}`);
    } catch (e) {
      console.error(`Seed: failed for SystemConfig ${config.key}`, e);
    }
  }

  for (const docType of seedDocumentTypes) {
    try {
      await prisma.documentType.upsert({
        where: { name: docType.name },
        update: { icon: docType.icon, isActive: docType.isActive },
        create: { name: docType.name, icon: docType.icon, isActive: docType.isActive },
      });
      console.log(`Seed: upsert OK for DocumentType ${docType.name}`);
    } catch (e) {
      console.error(`Seed: failed for DocumentType ${docType.name}`, e);
    }
  }
}

main()
  .catch((e) => {
    console.error("Seed script fatal error", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
