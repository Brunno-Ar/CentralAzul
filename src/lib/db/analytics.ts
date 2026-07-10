/**
 * Camada de dados - Analytics e Logs
 *
 * Responsavel por todas as operacoes relacionadas a analytics e logs:
 * - getLogs, addLog
 * - getAuditLogs
 */

import type { MockAuditLog } from "../db";
import { prisma, isDatabaseConnected, mockLogs, mockUsers } from "../db";

export type { MockAuditLog };

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

    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error, falling back", e);
      }
    }
    // Mock fallback: apply same RLS filter by matching user company
    let mockResult = mockLogs;
    if (userLevel !== undefined && userLevel === 2 && userCompany) {
      const companyUserIds = mockUsers
        .filter((u) => u.company === userCompany)
        .map((u) => u.id);
      mockResult = mockLogs.filter((log) =>
        companyUserIds.includes(log.userId),
      );
    }
    return mockResult;
  },

  addLog: async (
    userId: string,
    action: string,
    details: string,
    ipAddress?: string,
    userAgent?: string,
  ) => {
    const userObj = mockUsers.find((u) => u.id === userId);
    const newLog: MockAuditLog = {
      id: "log-" + Math.random().toString(36).substr(2, 9),
      userId,
      userName: userObj?.name || "Usuario",
      action,
      details,
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "Browser",
      createdAt: new Date(),
    };
    if (prisma && isDatabaseConnected()) {
      try {
        // Ensure user exists in db first
        let dbUser = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!dbUser) {
          if (userObj) {
            dbUser = await prisma.user.create({
              data: {
                id: userObj.id,
                name: userObj.name,
                email: userObj.email,
                image: userObj.image,
                role: userObj.role,
                hierarchyLevel: userObj.hierarchyLevel,
                company: userObj.company,
              },
            });
          }
        }
        await prisma.auditLog.create({
          data: {
            userId,
            action,
            details,
            ipAddress,
            userAgent,
          },
        });
      } catch (e) {
        console.error("Prisma error adding log, falling back", e);
      }
    }
    mockLogs.unshift(newLog);
    return newLog;
  },

  getAuditLogs: async (
    userLevel?: number,
    userCompany?: string,
  ) => {
    return analyticsDb.getLogs(userLevel, userCompany);
  },
};
