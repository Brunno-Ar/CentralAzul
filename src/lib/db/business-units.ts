/**
 * Camada de dados - Unidades de Negocio
 *
 * Responsavel por todas as operacoes relacionadas a unidades de negocio:
 * - getBusinessUnitsForHome, getBusinessUnits, getBusinessUnitBySlug
 * - addBusinessUnit, updateBusinessUnit, deleteBusinessUnit, createBusinessUnit
 * - syncBusinessUnitData, syncAllBusinessUnits
 * - getBusinessUnitItemOwner
 * - Operacoes de ferramentas: getBusinessUnitTools, getBusinessUnitToolById,
 *   addBusinessUnitTool, updateBusinessUnitTool, deleteBusinessUnitTool
 * - Operacoes de social links: getBusinessUnitSocialLinks, addBusinessUnitSocialLink,
 *   updateBusinessUnitSocialLink, deleteBusinessUnitSocialLink
 * - Operacoes de analytics: getBusinessUnitAnalytics, addBusinessUnitAnalytics,
 *   updateBusinessUnitAnalytics, deleteBusinessUnitAnalytics
 * - Operacoes de metadata: getBusinessUnitMetaData, addBusinessUnitMetaData,
 *   updateBusinessUnitMetaData, deleteBusinessUnitMetaData
 * - Operacoes de revenue: getBusinessUnitRevenue, addBusinessUnitRevenue,
 *   updateBusinessUnitRevenue, deleteBusinessUnitRevenue
 * - Operacoes de empresas: getCompanies, addCompany, createCompany,
 *   updateCompany, deleteCompany
 */

import type { MockBusinessUnitTool } from "../db";
import { prisma, isDatabaseConnected, mockBusinessUnits } from "../db";

export type { MockBusinessUnitTool };

export const businessUnitsDb = {
  // Tools
  addBusinessUnitTool: async (
    unitId: string,
    tool: Omit<MockBusinessUnitTool, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newTool = {
      ...tool,
      id: "tool-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.businessUnitTool.create({
          data: {
            businessUnitId: unitId,
            name: tool.name,
            url: tool.url,
            icon: tool.icon || null,
            description: tool.description || null,
            category: tool.category,
            isExternal: tool.isExternal,
            order: tool.order || 0,
            isActive: tool.isActive,
          },
        });
      } catch (e) {
        console.error("Prisma error adding tool", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    if (bu) {
      if (!bu.tools) bu.tools = [];
      bu.tools.push(newTool);
      return newTool;
    }
    return null;
  },

  deleteBusinessUnitTool: async (toolId: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        await prisma.businessUnitTool.delete({ where: { id: toolId } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting tool", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.tools) {
        const idx = bu.tools.findIndex((t) => t.id === toolId);
        if (idx !== -1) {
          bu.tools.splice(idx, 1);
          return true;
        }
      }
    }
    return false;
  },

  getBusinessUnitTools: async (unitId: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.businessUnitTool.findMany({
          where: { businessUnitId: unitId },
          orderBy: { order: "asc" },
        });
      } catch (e) {
        console.error("Prisma error getting tools", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    return bu?.tools || [];
  },

  getBusinessUnitToolById: async (toolId: string, unitId?: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.businessUnitTool.findUnique({
          where: { id: toolId, ...(unitId ? { businessUnitId: unitId } : {}) },
        });
      } catch (e) {
        console.error("Prisma error fetching single tool", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (unitId && bu.id !== unitId) continue;
      const tool = (bu.tools || []).find((t) => t.id === toolId);
      if (tool) return tool;
    }
    return null;
  },

  updateBusinessUnitTool: async (
    toolId: string,
    updates: Partial<MockBusinessUnitTool>,
  ) => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.businessUnitTool.update({
          where: { id: toolId },
          data: {
            ...(updates.name ? { name: updates.name } : {}),
            ...(updates.url ? { url: updates.url } : {}),
            ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
            ...(updates.description !== undefined
              ? { description: updates.description }
              : {}),
            ...(updates.category ? { category: updates.category } : {}),
            ...(updates.isExternal !== undefined
              ? { isExternal: updates.isExternal }
              : {}),
            ...(updates.order !== undefined ? { order: updates.order } : {}),
            ...(updates.isActive !== undefined
              ? { isActive: updates.isActive }
              : {}),
          },
        });
      } catch (e) {
        console.error("Prisma error updating tool", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.tools) {
        const idx = bu.tools.findIndex((t) => t.id === toolId);
        if (idx !== -1) {
          bu.tools[idx] = {
            ...bu.tools[idx],
            ...updates,
            updatedAt: new Date(),
          };
          return bu.tools[idx];
        }
      }
    }
    return null;
  },
};
