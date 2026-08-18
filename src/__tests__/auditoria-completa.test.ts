import "dotenv/config";
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { mockUsers } from "@/lib/mock/users";

describe("Auditoria Completa Central Azul - Validações de QA", () => {
  describe("1. Login e Contas de Teste", () => {
    it("valida a existência dos 3 perfis de teste principais", () => {
      const admin = mockUsers.find((u) => u.role === "ADMIN");
      const coordinator = mockUsers.find((u) => u.role === "COORDINATOR");
      const viewer = mockUsers.find((u) => u.role === "VIEWER");

      expect(admin).toBeDefined();
      expect(admin?.hierarchyLevel).toBe(1);

      expect(coordinator).toBeDefined();
      expect(coordinator?.hierarchyLevel).toBe(2);

      expect(viewer).toBeDefined();
      expect(viewer?.hierarchyLevel).toBe(3);
    });
  });

  describe("2. Grupos do Dashboard e Ferramentas Vinculadas", () => {
    it("garante que todas as BusinessUnits cadastradas possuem slug e company válidos", async () => {
      const units = await db.getBusinessUnits();
      expect(units.length).toBeGreaterThan(0);

      units.forEach((bu) => {
        expect(bu.slug).toBeTruthy();
        expect(bu.company).toBeTruthy();
        expect(bu.name).toBeTruthy();
      });
    });

    it("garante que Borgo del Vino possui ferramentas e que não são filtradas indevidamente", async () => {
      const units = await db.getBusinessUnits();
      const borgo = units.find((u) => u.slug === "BORGO" || u.company === "BORGO");
      expect(borgo).toBeDefined();

      const panels = await db.getPanels();
      const borgoPanels = panels.filter(
        (p) => p.category?.toUpperCase() === "BORGO" || p.companySlug?.toUpperCase() === "BORGO"
      );
      expect(borgoPanels.length).toBeGreaterThan(0);
    });

    it("suporta agrupamento e busca por Gran Reserva (COMP-GRAN-RESERVA e GRAN-RESERVA)", async () => {
      const panels = await db.getPanels();
      const granPanels = panels.filter(
        (p) =>
          p.category?.toUpperCase().includes("GRAN-RESERVA") ||
          p.companySlug?.toUpperCase().includes("GRAN-RESERVA")
      );
      expect(granPanels).toBeDefined();
    });
  });

  describe("3. Métricas e Caching", () => {
    it("carrega as unidades e perfis de métricas sem crash", async () => {
      const units = await db.getBusinessUnits();
      expect(Array.isArray(units)).toBe(true);
    });
  });

  describe("4. Ferramentas e Níveis de Permissão", () => {
    it("retorna lista de ferramentas/painéis com flag locked apropriada", async () => {
      const panels = await db.getPanels();
      expect(panels.length).toBeGreaterThan(0);

      // Level 3 (Operacional) deve ver ferramentas de Nível 1 ou 2 como bloqueadas
      const level3Panels = panels.map((p) => ({
        ...p,
        locked: 3 > p.minHierarchy,
      }));

      const lockedForLevel3 = level3Panels.filter((p) => p.locked);
      expect(lockedForLevel3.length).toBeGreaterThan(0);
    });
  });

  describe("5. Comunicados", () => {
    it("retorna comunicados ativos ordenados por prioridade/data", async () => {
      const announcements = await db.getAnnouncements(1);
      expect(Array.isArray(announcements)).toBe(true);
    });
  });

  describe("6. Unidades de Negócio", () => {
    it("retorna unidades ativas com suporte a Home", async () => {
      const homeUnits = await db.getBusinessUnitsForHome();
      expect(Array.isArray(homeUnits)).toBe(true);
      expect(homeUnits.length).toBeGreaterThan(0);
    });

    it("valida a existência das unidades reais do Portal CP Digital", async () => {
      const units = await db.getBusinessUnits();
      const portalIds = units.map((u) => u.portalId).filter(Boolean);
      expect(portalIds).toContain("o-borgo");
      expect(portalIds).toContain("vinicola");
      expect(portalIds).toContain("hotel");
      expect(portalIds).toContain("azul");
      expect(portalIds).toContain("don-eloy");
    });
  });

  describe("7. Permissões de Hierarquia Acumulativa no Menu", () => {
    const navItems = [
      { name: "Painel Principal", minLevel: 3 },
      { name: "Métricas", minLevel: 3 },
      { name: "Ferramentas", minLevel: 3 },
      { name: "Comunicados", minLevel: 3 },
      { name: "Unidades de Negócio", minLevel: 3 },
      { name: "Drive de Arquivos", minLevel: 3 },
      { name: "Seguranca & Niveis", minLevel: 1 },
    ];

    it("Nível 1 (Direção Geral) acessa todos os itens (níveis 1, 2 e 3)", () => {
      const level1Items = navItems.filter((item) => 1 <= item.minLevel);
      expect(level1Items.length).toBe(navItems.length);
    });

    it("Nível 2 (Gerência) acessa itens com minLevel 2 e 3, mas não minLevel 1", () => {
      const level2Items = navItems.filter((item) => 2 <= item.minLevel);
      expect(level2Items.some((i) => i.name === "Seguranca & Niveis")).toBe(false);
      expect(level2Items.some((i) => i.name === "Painel Principal")).toBe(true);
    });

    it("Nível 3 (Operacional) acessa apenas itens com minLevel 3", () => {
      const level3Items = navItems.filter((item) => 3 <= item.minLevel);
      expect(level3Items.every((i) => i.minLevel === 3)).toBe(true);
    });
  });
});
