/**
 * Camada de dados - Paineis
 *
 * Responsavel por todas as operacoes relacionadas a paineis:
 * - getPanels, getPanelByBusinessUnitToolId
 * - createPanel
 * - updatePanel
 * - deletePanel
 */

import type { MockSystemPanel } from "../db";
import { prisma, isDatabaseConnected, mockPanels } from "../db";

export type { MockSystemPanel };

export const panelsDb = {
  getPanels: async () => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.systemPanel.findMany({
          orderBy: { createdAt: "desc" },
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    return mockPanels;
  },

  getPanelByBusinessUnitToolId: async (businessUnitToolId: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.systemPanel.findUnique({
          where: { businessUnitToolId },
        });
      } catch (e) {
        console.error("Prisma error fetching panel by tool id", e);
      }
    }
    return (
      mockPanels.find(
        (p) =>
          (p as unknown as Record<string, unknown>).businessUnitToolId ===
          businessUnitToolId,
      ) || null
    );
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
    const newPanel = {
      ...panel,
      id: "panel-" + Math.random().toString(36).substr(2, 9),
      description: panel.description || "",
      isActive: panel.isActive !== undefined ? panel.isActive : true,
      companySlug: panel.companySlug || null,
      businessUnitToolId: panel.businessUnitToolId || null,
    };
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.systemPanel.create({
          data: {
            id: newPanel.id,
            name: newPanel.name,
            description: newPanel.description,
            url: newPanel.url,
            icon: newPanel.icon,
            category: newPanel.category,
            minRole: newPanel.minRole,
            minHierarchy: newPanel.minHierarchy,
            isActive: newPanel.isActive,
            companySlug: newPanel.companySlug || null,
            businessUnitToolId: newPanel.businessUnitToolId || null,
          },
        });
      } catch (e) {
        console.error("Prisma error creating panel, falling back", e);
      }
    }
    mockPanels.push(newPanel);
    return newPanel;
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
    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error updating panel, falling back", e);
      }
    }
    const panel = mockPanels.find((p) => p.id === id);
    if (panel) {
      if (updates.name !== undefined) panel.name = updates.name;
      if (updates.description !== undefined)
        panel.description = updates.description;
      if (updates.url !== undefined) panel.url = updates.url;
      if (updates.icon !== undefined) panel.icon = updates.icon;
      if (updates.category !== undefined) panel.category = updates.category;
      if (updates.minRole !== undefined) panel.minRole = updates.minRole;
      if (updates.minHierarchy !== undefined)
        panel.minHierarchy = updates.minHierarchy;
      if (updates.isActive !== undefined) panel.isActive = updates.isActive;
      if (updates.companySlug !== undefined)
        panel.companySlug = updates.companySlug;
      if (updates.businessUnitToolId !== undefined)
        (panel as unknown as Record<string, unknown>).businessUnitToolId =
          updates.businessUnitToolId;
      return panel;
    }
    return null;
  },

  deletePanel: async (id: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        await prisma.systemPanel.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting panel, falling back", e);
      }
    }
    const idx = mockPanels.findIndex((p) => p.id === id);
    if (idx !== -1) {
      mockPanels.splice(idx, 1);
      return true;
    }
    return false;
  },
};
