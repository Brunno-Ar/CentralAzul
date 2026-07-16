/**
 * Camada de dados - Comunicados (Anúncios)
 *
 * Responsável por todas as operações de banco de dados sobre comunicados e registros de leitura.
 */

import DOMPurify from "isomorphic-dompurify";
import { prisma } from "../db";
import { generateSecureId } from "../crypto-utils";

export const announcementsDb = {
  getAnnouncements: async (userLevel?: number, userCompany?: string) => {
    try {
      const dbAnns = await prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        include: { createdBy: true },
      });

      // Filtragem RLS:
      // Nível 1 (Direção) vê todos os anúncios.
      // Nível 2+ vê apenas se targetCompanies estiver vazio/nulo, for "all", ou contiver a empresa do usuário.
      const filtered = dbAnns.filter((ann) => {
        if (!userLevel || userLevel === 1) return true;
        
        if (!ann.targetCompanies || ann.targetCompanies.trim() === "" || ann.targetCompanies.toLowerCase() === "all") {
          return true;
        }
        
        if (userCompany) {
          const targets = ann.targetCompanies.split(",").map((s) => s.trim().toUpperCase());
          return targets.includes(userCompany.toUpperCase());
        }
        
        return false;
      });

      return filtered.map((ann) => ({
        id: ann.id,
        title: ann.title,
        content: ann.content ? DOMPurify.sanitize(ann.content) : "",
        priority: ann.priority,
        targetCompanies: ann.targetCompanies,
        expiresAt: ann.expiresAt,
        isPinned: ann.isPinned,
        isActive: ann.isActive,
        createdById: ann.createdById,
        createdByName: ann.createdBy?.name || "Autor",
        createdAt: ann.createdAt,
        updatedAt: ann.updatedAt,
      }));
    } catch (e) {
      console.error("Prisma error fetching announcements", e);
      return [];
    }
  },

  getAnnouncementReadsByUser: async (userId: string) => {
    try {
      return await prisma.announcementRead.findMany({
        where: { userId },
      });
    } catch (e) {
      console.error("Prisma error fetching announcement reads", e);
      return [];
    }
  },

  addAnnouncement: async (
    ann: {
      title: string;
      content: string;
      priority: string;
      targetCompanies?: string | null;
      expiresAt?: Date | string | null;
      isPinned?: boolean;
      isActive?: boolean;
      createdById: string;
    }
  ) => {
    const id = generateSecureId("ann-");
    try {
      const created = await prisma.announcement.create({
        data: {
          id,
          title: ann.title,
          content: ann.content,
          priority: ann.priority,
          targetCompanies: ann.targetCompanies || "",
          expiresAt: ann.expiresAt ? new Date(ann.expiresAt) : null,
          isPinned: ann.isPinned || false,
          isActive: ann.isActive !== undefined ? ann.isActive : true,
          createdById: ann.createdById,
        },
        include: { createdBy: true },
      });
      return {
        id: created.id,
        title: created.title,
        content: created.content,
        priority: created.priority,
        targetCompanies: created.targetCompanies,
        expiresAt: created.expiresAt,
        isPinned: created.isPinned,
        isActive: created.isActive,
        createdById: created.createdById,
        createdByName: created.createdBy?.name || "Autor",
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    } catch (e) {
      console.error("Prisma error creating announcement", e);
      throw e;
    }
  },

  updateAnnouncement: async (id: string, updates: {
    title?: string;
    content?: string;
    priority?: string;
    targetCompanies?: string;
    expiresAt?: Date | string | null;
    isPinned?: boolean;
    isActive?: boolean;
  }) => {
    try {
      const updated = await prisma.announcement.update({
        where: { id },
        data: {
          ...(updates.title !== undefined ? { title: updates.title } : {}),
          ...(updates.content !== undefined ? { content: updates.content } : {}),
          ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
          ...(updates.targetCompanies !== undefined ? { targetCompanies: updates.targetCompanies } : {}),
          ...(updates.expiresAt !== undefined ? { expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : null } : {}),
          ...(updates.isPinned !== undefined ? { isPinned: updates.isPinned } : {}),
          ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
        },
        include: { createdBy: true },
      });
      return {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        priority: updated.priority,
        targetCompanies: updated.targetCompanies,
        expiresAt: updated.expiresAt,
        isPinned: updated.isPinned,
        isActive: updated.isActive,
        createdById: updated.createdById,
        createdByName: updated.createdBy?.name || "Autor",
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (e) {
      console.error("Prisma error updating announcement", e);
      throw e;
    }
  },

  deleteAnnouncement: async (id: string) => {
    try {
      await prisma.announcement.delete({ where: { id } });
      return true;
    } catch (e) {
      console.error("Prisma error deleting announcement", e);
      return false;
    }
  },

  markAnnouncementAsRead: async (announcementId: string, userId: string) => {
    const id = generateSecureId("read-");
    try {
      const created = await prisma.announcementRead.create({
        data: {
          id,
          announcementId,
          userId,
        },
      });
      return created;
    } catch (e) {
      console.error("Prisma error marking announcement as read", e);
      throw e;
    }
  },
};
