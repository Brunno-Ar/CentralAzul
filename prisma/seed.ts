import { PrismaClient, Company } from "@prisma/client";

const prisma = new PrismaClient();

type AggregatingUnit = {
  slug: string;
  name: string;
  company: Company;
  showOnHome: boolean;
};

const aggregatingUnits: AggregatingUnit[] = [
  {
    slug: "aggregadora-borgo",
    name: "Unidade Agregadora Borgo",
    company: Company.BORGO,
    showOnHome: true,
  },
  {
    slug: "aggregadora-maple-bear",
    name: "Unidade Agregadora Maple Bear",
    company: Company.MAPLE_BEAR,
    showOnHome: true,
  },
  {
    slug: "aggregadora-azul",
    name: "Unidade Agregadora Azul",
    company: Company.AZUL,
    showOnHome: true,
  },
  {
    slug: "central-azul",
    name: "Unidade Agregadora Central Azul",
    company: Company.CENTRAL,
    showOnHome: true,
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
          showOnHome: unit.showOnHome,
        },
        create: {
          slug: unit.slug,
          name: unit.name,
          company: unit.company,
          showOnHome: unit.showOnHome,
          description:
            "Unidade agregadora responsavel pela gestao integrada do grupo.",
          isActive: true,
          order: 0,
        },
      });
      console.log(`Seed: upsert OK for ${unit.company} (${unit.slug})`);
    } catch (e) {
      console.error(`Seed: failed for ${unit.company} (${unit.slug})`, e);
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
