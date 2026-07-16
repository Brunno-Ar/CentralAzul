/**
 * Camada de dados - Permissoes e Seguranca
 *
 * Responsavel por todas as operacoes relacionadas a permissoes e seguranca.
 */

import { prisma, getSystemConfig } from "../db";

export interface MockLevelConfig {
  id: string;
  level: number;
  name: string;
  createdAt: Date;
}

export interface MockMenuPermission {
  href: string;
  name: string;
  minLevel: number;
  icon?: string | null;
  order?: number;
  isActive?: boolean;
}

export const permissionsDb = {
  getLevels: async () => {
    try {
      const dbLevels = await prisma.levelConfig.findMany({
        orderBy: { level: "asc" },
      });
      return dbLevels;
    } catch (e) {
      console.error("Prisma error fetching levels", e);
      return [];
    }
  },

  createLevel: async (level: { level: number; name: string }) => {
    try {
      const created = await prisma.levelConfig.create({
        data: {
          level: level.level,
          name: level.name,
        },
      });
      return created;
    } catch (e) {
      console.error("Prisma error creating level", e);
      throw e;
    }
  },

  deleteLevel: async (id: string) => {
    try {
      await prisma.levelConfig.delete({ where: { id } });
      return true;
    } catch (e) {
      console.error("Prisma error deleting level", e);
      throw e;
    }
  },

  updateLevel: async (id: string, updates: { level?: number; name?: string }) => {
    try {
      const updated = await prisma.levelConfig.update({
        where: { id },
        data: {
          ...(updates.level !== undefined ? { level: updates.level } : {}),
          ...(updates.name !== undefined ? { name: updates.name } : {}),
        },
      });
      return updated;
    } catch (e) {
      console.error("Prisma error updating level", e);
      throw e;
    }
  },

  getMenuPermissions: async () => {
    try {
      const dbPerms = await prisma.menuPermission.findMany({
        orderBy: { order: "asc" },
      });
      return dbPerms;
    } catch (e) {
      console.error("Prisma error fetching menu permissions", e);
      return [];
    }
  },

  updateMenuPermission: async (
    href: string,
    updates: number | { name?: string; minLevel?: number; icon?: string | null; order?: number; isActive?: boolean }
  ) => {
    const data = typeof updates === "number" ? { minLevel: updates } : updates;
    try {
      const updated = await prisma.menuPermission.update({
        where: { href },
        data,
      });
      return updated;
    } catch (e) {
      console.error("Prisma error updating menu permission", e);
      throw e;
    }
  },

  createMenuPermission: async (perm: { href: string; name: string; minLevel: number; icon?: string | null; order?: number; isActive?: boolean }) => {
    try {
      const created = await prisma.menuPermission.create({
        data: {
          href: perm.href,
          name: perm.name,
          minLevel: perm.minLevel,
          icon: perm.icon,
          order: perm.order,
          isActive: perm.isActive,
        },
      });
      return created;
    } catch (e) {
      console.error("Prisma error creating menu permission", e);
      throw e;
    }
  },

  deleteMenuPermission: async (href: string) => {
    try {
      await prisma.menuPermission.delete({ where: { href } });
      return true;
    } catch (e) {
      console.error("Prisma error deleting menu permission", e);
      throw e;
    }
  },

  // Account Lockout
  checkAccountLockout: async (email: string): Promise<{ locked: boolean; lockedUntil?: Date }> => {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { failedLoginAttempts: true, lockedUntil: true },
      });
      if (user) {
        const now = new Date();
        if (user.lockedUntil && user.lockedUntil > now) {
          return { locked: true, lockedUntil: user.lockedUntil };
        }
      }
      return { locked: false };
    } catch (e) {
      console.error("Prisma error checking lockout", e);
      return { locked: false };
    }
  },

  recordFailedLoginAttempt: async (email: string): Promise<{ locked: boolean; lockedUntil?: Date }> => {
    const normalizedEmail = email.toLowerCase();
    const thresholdVal = await getSystemConfig("lockoutThreshold");
    const durationVal = await getSystemConfig("lockoutDurationMs");
    const lockoutThreshold = parseInt(thresholdVal || "5", 10);
    const lockoutDurationMs = parseInt(durationVal || "900000", 10);

    try {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { failedLoginAttempts: true, lockedUntil: true },
      });
      if (user) {
        const newAttempts = user.failedLoginAttempts + 1;
        let lockedUntil: Date | null = null;
        if (newAttempts >= lockoutThreshold) {
          lockedUntil = new Date(Date.now() + lockoutDurationMs);
        }
        await prisma.user.update({
          where: { email: normalizedEmail },
          data: {
            failedLoginAttempts: newAttempts,
            ...(lockedUntil ? { lockedUntil } : {}),
          },
        });
        return { locked: !!lockedUntil, lockedUntil: lockedUntil || undefined };
      }
      return { locked: false };
    } catch (e) {
      console.error("Prisma error recording failed attempt", e);
      throw e;
    }
  },

  resetFailedLoginAttempts: async (email: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    try {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      return;
    } catch (e) {
      console.error("Prisma error resetting failed attempts", e);
      throw e;
    }
  },

  // Role Permissions
  getRolePermissions: async () => {
    try {
      return await prisma.rolePermission.findMany({
        orderBy: [{ role: "asc" }, { action: "asc" }],
      });
    } catch (e) {
      console.error("Prisma error listing role permissions:", e);
      return [];
    }
  },

  createRolePermission: async (role: string, action: string) => {
    try {
      return await prisma.rolePermission.create({
        data: { role, action },
      });
    } catch (e) {
      console.error("Prisma error creating role permission:", e);
      throw e;
    }
  },

  deleteRolePermission: async (role: string, action: string) => {
    try {
      await prisma.rolePermission.delete({
        where: {
          role_action: { role, action },
        },
      });
      return true;
    } catch (e) {
      console.error("Prisma error deleting role permission:", e);
      return false;
    }
  },
};
