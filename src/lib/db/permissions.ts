/**
 * Camada de dados - Permissoes e Seguranca
 *
 * Responsavel por todas as operacoes relacionadas a permissoes e seguranca:
 * - getLevels, createLevel, deleteLevel
 * - getMenuPermissions, updateMenuPermission
 * - checkAccountLockout, recordFailedLoginAttempt, resetFailedLoginAttempts
 */

import type { MockLevelConfig, MockMenuPermission } from "../db";
import {
  prisma,
  isDatabaseConnected,
  mockLevels,
  mockMenuPermissions,
  lockoutState,
  LOCKOUT_THRESHOLD,
  LOCKOUT_DURATION_MS,
} from "../db";

export type { MockLevelConfig, MockMenuPermission };

export const permissionsDb = {
  getLevels: async () => {
    if (prisma && isDatabaseConnected()) {
      try {
        const dbLevels = await prisma.levelConfig.findMany({
          orderBy: { level: "asc" },
        });
        if (dbLevels.length > 0) {
          return dbLevels.map((l) => ({
            id: l.id,
            level: l.level,
            name: l.name,
            createdAt: l.createdAt,
          }));
        }

        // Seed database if LevelConfig table is empty
        for (const l of mockLevels) {
          await prisma.levelConfig.create({
            data: {
              level: l.level,
              name: l.name,
            },
          });
        }
        const refetched = await prisma.levelConfig.findMany({
          orderBy: { level: "asc" },
        });
        return refetched.map((l) => ({
          id: l.id,
          level: l.level,
          name: l.name,
          createdAt: l.createdAt,
        }));
      } catch (e) {
        console.error("Prisma error fetching levels, falling back", e);
      }
    }
    return mockLevels.sort((a, b) => a.level - b.level);
  },

  createLevel: async (level: { level: number; name: string }) => {
    if (prisma && isDatabaseConnected()) {
      try {
        const created = await prisma.levelConfig.create({
          data: {
            level: level.level,
            name: level.name,
          },
        });
        return {
          id: created.id,
          level: created.level,
          name: created.name,
          createdAt: created.createdAt,
        };
      } catch (e) {
        console.error("Prisma error creating level, falling back", e);
      }
    }
    const newLvl: MockLevelConfig = {
      id: "lvl-" + Math.random().toString(36).substr(2, 9),
      level: level.level,
      name: level.name,
      createdAt: new Date(),
    };
    mockLevels.push(newLvl);
    return newLvl;
  },

  deleteLevel: async (id: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        await prisma.levelConfig.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting level, falling back", e);
      }
    }
    const idx = mockLevels.findIndex((l) => l.id === id);
    if (idx !== -1) {
      mockLevels.splice(idx, 1);
      return true;
    }
    return false;
  },

  updateLevel: async (id: string, updates: { level?: number; name?: string }) => {
    if (prisma && isDatabaseConnected()) {
      try {
        const updated = await prisma.levelConfig.update({
          where: { id },
          data: {
            ...(updates.level !== undefined ? { level: updates.level } : {}),
            ...(updates.name !== undefined ? { name: updates.name } : {}),
          },
        });
        return {
          id: updated.id,
          level: updated.level,
          name: updated.name,
          createdAt: updated.createdAt,
        };
      } catch (e) {
        console.error("Prisma error updating level, falling back", e);
      }
    }
    const level = mockLevels.find((l) => l.id === id);
    if (level) {
      if (updates.level !== undefined) level.level = updates.level;
      if (updates.name !== undefined) level.name = updates.name;
      return level;
    }
    return null;
  },

  getMenuPermissions: async () => {
    if (prisma && isDatabaseConnected()) {
      try {
        const dbPerms = await prisma.menuPermission.findMany({
          orderBy: { href: "asc" },
        });
        if (dbPerms.length > 0) {
          return dbPerms.map((p) => ({
            id: p.id,
            href: p.href,
            name: p.name,
            minLevel: p.minLevel,
          }));
        }

        // Seed database if MenuPermission table is empty
        for (const p of mockMenuPermissions) {
          await prisma.menuPermission.create({
            data: {
              href: p.href,
              name: p.name,
              minLevel: p.minLevel,
            },
          });
        }
        const refetched = await prisma.menuPermission.findMany({
          orderBy: { href: "asc" },
        });
        return refetched.map((p) => ({
          id: p.id,
          href: p.href,
          name: p.name,
          minLevel: p.minLevel,
        }));
      } catch (e) {
        console.error("Prisma error fetching menu permissions, falling back", e);
      }
    }
    return mockMenuPermissions;
  },

  updateMenuPermission: async (href: string, minLevel: number) => {
    if (prisma && isDatabaseConnected()) {
      try {
        const updated = await prisma.menuPermission.update({
          where: { href },
          data: { minLevel },
        });
        return {
          id: updated.id,
          href: updated.href,
          name: updated.name,
          minLevel: updated.minLevel,
        };
      } catch (e) {
        console.error("Prisma error updating menu permission, falling back", e);
      }
    }
    const permission = mockMenuPermissions.find((p) => p.href === href);
    if (permission) {
      permission.minLevel = minLevel;
      return permission;
    }
    return null;
  },

  createMenuPermission: async (perm: { href: string; name: string; minLevel: number }) => {
    if (prisma && isDatabaseConnected()) {
      try {
        const created = await prisma.menuPermission.create({
          data: {
            href: perm.href,
            name: perm.name,
            minLevel: perm.minLevel,
          },
        });
        return {
          id: created.id,
          href: created.href,
          name: created.name,
          minLevel: created.minLevel,
        };
      } catch (e) {
        console.error("Prisma error creating menu permission, falling back", e);
      }
    }
    const newPerm: MockMenuPermission = {
      href: perm.href,
      name: perm.name,
      minLevel: perm.minLevel,
    };
    mockMenuPermissions.push(newPerm);
    return newPerm;
  },

  deleteMenuPermission: async (href: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        await prisma.menuPermission.delete({ where: { href } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting menu permission, falling back", e);
      }
    }
    const idx = mockMenuPermissions.findIndex((p) => p.href === href);
    if (idx !== -1) {
      mockMenuPermissions.splice(idx, 1);
      return true;
    }
    return false;
  },

  // Account Lockout
  checkAccountLockout: async (email: string): Promise<{ locked: boolean; lockedUntil?: Date }> => {
    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error checking lockout, falling back", e);
      }
    }
    const state = lockoutState.get(email.toLowerCase());
    const now = new Date();
    if (state && state.lockedUntil && state.lockedUntil > now) {
      return { locked: true, lockedUntil: state.lockedUntil };
    }
    return { locked: false };
  },

  recordFailedLoginAttempt: async (email: string): Promise<{ locked: boolean; lockedUntil?: Date }> => {
    const normalizedEmail = email.toLowerCase();
    if (prisma && isDatabaseConnected()) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { failedLoginAttempts: true, lockedUntil: true },
        });
        if (user) {
          const newAttempts = user.failedLoginAttempts + 1;
          let lockedUntil: Date | null = null;
          if (newAttempts >= LOCKOUT_THRESHOLD) {
            lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
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
      } catch (e) {
        console.error("Prisma error recording failed attempt, falling back", e);
      }
    }
    const state = lockoutState.get(normalizedEmail) || { attempts: 0 };
    state.attempts += 1;
    if (state.attempts >= LOCKOUT_THRESHOLD) {
      state.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }
    lockoutState.set(normalizedEmail, state);
    return { locked: !!state.lockedUntil, lockedUntil: state.lockedUntil };
  },

  resetFailedLoginAttempts: async (email: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error resetting failed attempts, falling back", e);
      }
    }
    lockoutState.delete(normalizedEmail);
  },
};
