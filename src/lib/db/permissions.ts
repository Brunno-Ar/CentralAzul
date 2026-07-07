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
    return mockLevels.sort((a, b) => a.level - b.level);
  },

  createLevel: async (level: { level: number; name: string }) => {
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
    const idx = mockLevels.findIndex((l) => l.id === id);
    if (idx !== -1) {
      mockLevels.splice(idx, 1);
      return true;
    }
    return false;
  },

  getMenuPermissions: async () => {
    return mockMenuPermissions;
  },

  updateMenuPermission: async (href: string, minLevel: number) => {
    const permission = mockMenuPermissions.find((p) => p.href === href);
    if (permission) {
      permission.minLevel = minLevel;
      return permission;
    }
    return null;
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
