import { PrismaClient, Company } from "@prisma/client";

const prisma = new PrismaClient();

type AggregatingUnit = {
  slug: string;
  name: string;
  company: Company;
  description: string;
  showOnHome: boolean;
  order: number;
};

const aggregatingUnits: AggregatingUnit[] = [
  {
    slug: "BORGO",
    name: "Borgo del Vino",
    company: Company.BORGO,
    description: "Primeiro condomínio vinícola da Região Serrana e Sudeste. Inspirado nas vilas da Toscana, integrando vinhedos próprios, hotel boutique, spa, enoteca e restaurante em um cenário espetacular.",
    showOnHome: true,
    order: 1,
  },
  {
    slug: "MAPLE_BEAR",
    name: "Maple Bear",
    company: Company.MAPLE_BEAR,
    description: "Rede de ensino bilíngue com metodologia canadense focada no desenvolvimento crítico.",
    showOnHome: true,
    order: 2,
  },
  {
    slug: "AZUL",
    name: "Grupo Azul",
    company: Company.AZUL,
    description: "Incorporadora de alto padrão com portfólio de condomínios de luxo e prontos para morar.",
    showOnHome: true,
    order: 3,
  },
  {
    slug: "COMP-GRAN-RESERVA",
    name: "Gran Reserva",
    company: Company.BORGO,
    description: "Lançamento de lotes exclusivos de alto padrão inserido no complexo Borgo del Vino.",
    showOnHome: true,
    order: 4,
  },
];

const seedLevels = [
  { level: 1, name: "Direcao Geral" },
  { level: 2, name: "Gerencia / Coordenacao" },
  { level: 3, name: "Operacional" },
];

const seedMenuPermissions = [
  { href: "/dashboard", name: "Painel Principal", minLevel: 3 },
  { href: "/dashboard/ferramentas", name: "Ferramentas", minLevel: 3 },
  { href: "/dashboard/comunicados", name: "Comunicados", minLevel: 3 },
  { href: "/dashboard/unidades", name: "Unidades de Negocio", minLevel: 3 },
  { href: "/dashboard/documentos", name: "Drive de Arquivos", minLevel: 3 },
  { href: "/dashboard/seguranca", name: "Seguranca & Niveis", minLevel: 1 },
  { href: "/dashboard/configuracoes", name: "Configuracoes", minLevel: 99 },
];

async function main() {
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
        update: { name: perm.name, minLevel: perm.minLevel },
        create: { href: perm.href, name: perm.name, minLevel: perm.minLevel },
      });
      console.log(`Seed: upsert OK for menu permission ${perm.href}`);
    } catch (e) {
      console.error(`Seed: failed for menu permission ${perm.href}`, e);
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
