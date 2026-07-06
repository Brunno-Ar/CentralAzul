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
}

main()
  .catch((e) => {
    console.error("Seed script fatal error", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
