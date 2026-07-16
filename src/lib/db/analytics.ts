/**
 * Camada de dados - Analytics e Logs
 *
 * Responsavel por todas as operacoes relacionadas a analytics e logs.
 */

import { prisma } from "../db";

export const analyticsDb = {
  getLogs: async (
    userLevel?: number,
    userCompany?: string,
  ) => {
    // Applicative RLS for audit logs.
    // Level 1 sees ALL logs. Level 2 sees only logs from users in their company.
    const whereFilter =
      userLevel !== undefined && userLevel === 2 && userCompany
        ? { user: { company: userCompany } }
        : undefined;

    try {
      const dbLogs = await prisma.auditLog.findMany({
        where: whereFilter as never,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return dbLogs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.user.name || "Usuario",
        action: l.action,
        details: l.details,
        ipAddress: l.ipAddress || "",
        userAgent: l.userAgent || "",
        createdAt: l.createdAt,
      }));
    } catch (e) {
      console.error("Prisma error getting logs", e);
      return [];
    }
  },

  addLog: async (
    userId: string,
    action: string,
    details: string,
    ipAddress?: string,
    userAgent?: string,
  ) => {
    try {
      const created = await prisma.auditLog.create({
        data: {
          userId,
          action,
          details,
          ipAddress: ipAddress || "127.0.0.1",
          userAgent: userAgent || "Browser",
        },
        include: { user: true },
      });
      return {
        id: created.id,
        userId: created.userId,
        userName: created.user.name || "Usuario",
        action: created.action,
        details: created.details,
        ipAddress: created.ipAddress || "",
        userAgent: created.userAgent || "",
        createdAt: created.createdAt,
      };
    } catch (e) {
      console.error("Prisma error adding log", e);
      throw e;
    }
  },

  getAuditLogs: async (
    userLevel?: number,
    userCompany?: string,
  ) => {
    return analyticsDb.getLogs(userLevel, userCompany);
  },
};
