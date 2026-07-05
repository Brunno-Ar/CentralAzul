import { describe, it, expect } from "vitest";
import { Company } from "@prisma/client";

/**
 * T2 - Test: seed de unidades agregadoras
 *
 * Verifica que para cada valor do enum Company existe >=1 BusinessUnit
 * com showOnHome=true, testando:
 * 1. A configuracao de seed (aggregatingUnits)
 * 2. Os mockBusinessUnits em fallback
 */

// Mirror of the aggregatingUnits array from prisma/seed.ts
const aggregatingUnits = [
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
] as const;

const allCompanyValues = Object.values(Company);

describe("T2: Business Unit seed - unidades agregadoras", () => {
  describe("aggregatingUnits (seed config)", () => {
    allCompanyValues.forEach((company) => {
      it(`garante >=1 BU com showOnHome=true para ${company}`, () => {
        const matching = aggregatingUnits.filter(
          (u) => u.company === company && u.showOnHome === true,
        );
        expect(matching.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("tem exatamente 4 unidades agregadoras (uma por enum)", () => {
      expect(aggregatingUnits.length).toBe(allCompanyValues.length);
    });

    it("todas as unidades agregadoras tem showOnHome=true", () => {
      aggregatingUnits.forEach((u) => {
        expect(u.showOnHome).toBe(true);
      });
    });

    it("cada enum Company tem slug unico", () => {
      const slugs = aggregatingUnits.map((u) => u.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });

  describe("mockBusinessUnits (fallback)", () => {
    // Import after env setup to get the mock data
    it("getBusinessUnits() retorna objetos com showOnHome=true", async () => {
      // Dynamic import to avoid Prisma connection attempts
      const { db } = await import("@/lib/db");
      const units = await db.getBusinessUnits();
      expect(units.length).toBeGreaterThan(0);
      units.forEach((u) => {
        expect(u).toHaveProperty("showOnHome");
        expect(typeof u.showOnHome).toBe("boolean");
      });
    });

    it("inclui bu-5 (CENTRAL) com showOnHome=true", async () => {
      const { db } = await import("@/lib/db");
      const units = await db.getBusinessUnits();
      const central = units.find((u) => u.slug === "central-azul");
      expect(central).toBeDefined();
      expect(central?.company).toBe(Company.CENTRAL);
      expect(central?.showOnHome).toBe(true);
    });

    allCompanyValues.forEach((company) => {
      it(`mock tem >=1 BU com showOnHome=true para ${company}`, async () => {
        const { db } = await import("@/lib/db");
        const units = await db.getBusinessUnits();
        const matching = units.filter(
          (u) => u.company === company && u.showOnHome === true,
        );
        expect(matching.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
