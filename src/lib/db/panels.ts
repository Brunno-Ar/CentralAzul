/**
 * Camada de dados - Paineis
 *
 * Responsavel por todas as operacoes relacionadas a paineis.
 */

import { prisma } from "../db";
import { generateSecureId } from "../crypto-utils";

export const panelsDb = {
  getPanels: async () => {
    try {
      return await prisma.systemPanel.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch (e) {
      console.error("Prisma error getting panels", e);
      return [];
    }
  },

  getPanelByBusinessUnitToolId: async (businessUnitToolId: string) => {
    try {
      return await prisma.systemPanel.findUnique({
        where: { businessUnitToolId },
      });
    } catch (e) {
      console.error("Prisma error fetching panel by tool id", e);
      return null;
    }
  },

  createPanel: async (panel: {
    name: string;
    description?: string;
    url: string;
    icon: string;
    category: string;
    minRole: string;
    minHierarchy: number;
    isActive?: boolean;
    companySlug?: string | null;
    businessUnitToolId?: string | null;
  }) => {
    try {
      const generatedId = generateSecureId("panel-");
      return await prisma.systemPanel.create({
        data: {
          id: generatedId,
          name: panel.name,
          description: panel.description || "",
          url: panel.url,
          icon: panel.icon,
          category: panel.category,
          minRole: panel.minRole,
          minHierarchy: panel.minHierarchy,
          isActive: panel.isActive !== undefined ? panel.isActive : true,
          companySlug: panel.companySlug || null,
          businessUnitToolId: panel.businessUnitToolId || null,
        },
      });
    } catch (e) {
      console.error("Prisma error creating panel", e);
      throw e;
    }
  },

  updatePanel: async (
    id: string,
    updates: {
      name?: string;
      description?: string;
      url?: string;
      icon?: string;
      category?: string;
      minRole?: string;
      minHierarchy?: number;
      isActive?: boolean;
      companySlug?: string | null;
      businessUnitToolId?: string | null;
    },
  ) => {
    try {
      return await prisma.systemPanel.update({
        where: { id },
        data: {
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.description !== undefined
            ? { description: updates.description }
            : {}),
          ...(updates.url !== undefined ? { url: updates.url } : {}),
          ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
          ...(updates.category !== undefined
            ? { category: updates.category }
            : {}),
          ...(updates.minRole !== undefined
            ? { minRole: updates.minRole }
            : {}),
          ...(updates.minHierarchy !== undefined
            ? { minHierarchy: updates.minHierarchy }
            : {}),
          ...(updates.isActive !== undefined
            ? { isActive: updates.isActive }
            : {}),
          ...(updates.companySlug !== undefined
            ? { companySlug: updates.companySlug }
            : {}),
          ...(updates.businessUnitToolId !== undefined
            ? { businessUnitToolId: updates.businessUnitToolId }
            : {}),
        },
      });
    } catch (e) {
      console.error("Prisma error updating panel", e);
      throw e;
    }
  },

  deletePanel: async (id: string) => {
    try {
      await prisma.systemPanel.delete({ where: { id } });
      return true;
    } catch (e) {
      console.error("Prisma error deleting panel", e);
      return false;
    }
  },
};
