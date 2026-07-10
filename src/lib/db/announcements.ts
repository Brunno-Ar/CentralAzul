/**
 * Camada de dados - Comunicados (Anúncios)
 *
 * Responsável por todas as operações de banco de dados sobre comunicados e registros de leitura.
 */

import DOMPurify from "isomorphic-dompurify";
import { prisma, isDatabaseConnected } from "../db";

export interface MockAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetCompanies: string | null;
  expiresAt: Date | null;
  isPinned: boolean;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName?: string;
}

export interface MockAnnouncementRead {
  id: string;
  announcementId: string;
  userId: string;
  readAt: Date;
}

// Fallbacks locais em memória caso o banco não esteja conectado
let mockAnnouncements: MockAnnouncement[] = [
  {
    id: "ann-1",
    title: "Nova integração de Segurança",
    content:
      "Todas as credenciais de ferramentas agora estão integradas com o token ativo do Outlook profissional. Não é mais necessário login separado para acessar os painéis.",
    priority: "IMPORTANT",
    targetCompanies: "",
    expiresAt: null,
    isPinned: true,
    isActive: true,
    createdById: "user-director",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdByName: "Diretor Grupo Azul",
  },
  {
    id: "ann-2",
    title: "Manutenção Hostinger MySQL",
    content:
      "Manutenção programada do banco de dados na madrugada de domingo das 02:00 às 04:00. A CentralAzul pode ficar indisponível neste período.",
    priority: "WARNING",
    targetCompanies: "",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isPinned: false,
    isActive: true,
    createdById: "user-admin",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdByName: "Administrador Central",
  },
  {
    id: "ann-3",
    title: "Atualização de Políticas de Acesso",
    content:
      "Foram atualizadas novas diretrizes de segurança da informação. Todos os colaboradores devem revisar o documento 'Diretrizes de Segurança da Informação 2026' disponível no Drive.",
    priority: "INFO",
    targetCompanies: "",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isPinned: false,
    isActive: true,
    createdById: "user-director",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdByName: "Diretor Grupo Azul",
  },
];

let mockAnnouncementReads: MockAnnouncementRead[] = [];

export const announcementsDb = {
  getAnnouncements: async (userLevel?: number, userCompany?: string) => {
    if (prisma && isDatabaseConnected()) {
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
          content: DOMPurify.sanitize(ann.content),
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
        console.error("Prisma error fetching announcements, falling back", e);
      }
    }

    // Fallback Mock com a mesma regra de RLS
    const filteredMock = mockAnnouncements.filter((ann) => {
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

    return filteredMock.map((ann) => ({
      ...ann,
      content: DOMPurify.sanitize(ann.content),
    }));
  },

  getAnnouncementReadsByUser: async (userId: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.announcementRead.findMany({
          where: { userId },
        });
      } catch (e) {
        console.error("Prisma error fetching announcement reads, falling back", e);
      }
    }
    return mockAnnouncementReads.filter((r) => r.userId === userId);
  },

  addAnnouncement: async (
    ann: Omit<MockAnnouncement, "id" | "createdAt" | "updatedAt" | "createdByName"> & { createdByName?: string }
  ) => {
    const id = "ann-" + Math.random().toString(36).substr(2, 9);
    const newAnn: MockAnnouncement = {
      ...ann,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: ann.expiresAt ? new Date(ann.expiresAt) : null,
      targetCompanies: ann.targetCompanies || "",
    };

    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error creating announcement, falling back", e);
      }
    }

    mockAnnouncements.unshift(newAnn);
    return newAnn;
  },

  updateAnnouncement: async (id: string, updates: Partial<MockAnnouncement>) => {
    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error updating announcement, falling back", e);
      }
    }

    const idx = mockAnnouncements.findIndex((a) => a.id === id);
    if (idx !== -1) {
      mockAnnouncements[idx] = {
        ...mockAnnouncements[idx],
        ...updates,
        updatedAt: new Date(),
        expiresAt: updates.expiresAt !== undefined ? (updates.expiresAt ? new Date(updates.expiresAt) : null) : mockAnnouncements[idx].expiresAt,
      };
      return mockAnnouncements[idx];
    }
    return null;
  },

  deleteAnnouncement: async (id: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        await prisma.announcement.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting announcement, falling back", e);
      }
    }

    const idx = mockAnnouncements.findIndex((a) => a.id === id);
    if (idx !== -1) {
      mockAnnouncements.splice(idx, 1);
      return true;
    }
    return false;
  },

  markAnnouncementAsRead: async (announcementId: string, userId: string) => {
    const id = "read-" + Math.random().toString(36).substr(2, 9);
    const newRead = {
      id,
      announcementId,
      userId,
      readAt: new Date(),
    };

    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error marking announcement as read, falling back", e);
      }
    }

    const exists = mockAnnouncementReads.some(
      (r) => r.announcementId === announcementId && r.userId === userId
    );
    if (!exists) {
      mockAnnouncementReads.push(newRead);
    }
    return newRead;
  },
};
