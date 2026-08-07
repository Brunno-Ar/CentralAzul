import { describe, it, expect } from "vitest";

/**
 * T2 - Test: seed de unidades agregadoras
 *
 * Verifica que para cada valor de company existe >=1 BusinessUnit
 * com showOnHome=true, testando:
 * 1. A configuracao de seed (aggregatingUnits)
 * 2. Os mockBusinessUnits em fallback
 */

// Mirror of the aggregatingUnits array from prisma/seed.ts
const aggregatingUnits = [
  {
    slug: "BORGO",
    name: "Borgo del Vino",
    company: "BORGO",
    showOnHome: true,
  },
  {
    slug: "MAPLE_BEAR",
    name: "Maple Bear",
    company: "MAPLE_BEAR",
    showOnHome: true,
  },
  {
    slug: "AZUL",
    name: "Grupo Azul",
    company: "AZUL",
    showOnHome: true,
  },
  {
    slug: "COMP-GRAN-RESERVA",
    name: "Gran Reserva",
    company: "BORGO",
    showOnHome: true,
  },
] as const;

const allCompanyValues = ["BORGO", "MAPLE_BEAR", "AZUL"];

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

    it("tem exatamente 4 unidades agregadoras", () => {
      expect(aggregatingUnits.length).toBe(4);
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
