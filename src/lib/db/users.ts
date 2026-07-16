/**
 * Camada de dados - Usuarios
 *
 * Responsavel por todas as operacoes relacionadas a usuarios.
 */

import { prisma, getSystemConfig } from "../db";
import { generateSecureId } from "../crypto-utils";

export interface MockUserMfa {
  id: string;
  userId: string;
  secret: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const usersDb = {
  getUsers: async () => {
    try {
      return await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          hierarchyLevel: true,
          company: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e) {
      console.error("Prisma error fetching users", e);
      return [];
    }
  },

  getUserByEmail: async (email: string) => {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (e) {
      console.error("Prisma error fetching user by email", e);
      return null;
    }
  },

  getUserById: async (id: string) => {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (e) {
      console.error("Prisma error fetching user by id", e);
      return null;
    }
  },

  updateUserHierarchy: async (
    id: string,
    role: string,
    level: number,
    status?: string,
  ) => {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          role,
          hierarchyLevel: level,
          ...(status ? { status } : {}),
        },
      });
    } catch (e) {
      console.error("Prisma error updating user hierarchy", e);
      throw e;
    }
  },

  updateUserProfile: async (
    id: string,
    data: { name?: string; image?: string; password?: string }
  ) => {
    try {
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (e) {
      console.error("Prisma error updating user profile", e);
      throw e;
    }
  },

  addUser: async (user: {
    name: string;
    email: string;
    role: string;
    hierarchyLevel: number;
    company: string;
    password?: string;
  }) => {
    try {
      const generatedId = generateSecureId("user-");
      const defaultImage = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120";
      return await prisma.user.create({
        data: {
          id: generatedId,
          name: user.name,
          email: user.email,
          image: defaultImage,
          password: user.password || null,
          role: user.role,
          hierarchyLevel: user.hierarchyLevel,
          company: user.company,
          status: "ACTIVE",
        },
      });
    } catch (e) {
      console.error("Prisma error adding user", e);
      throw e;
    }
  },

  createUser: async (user: {
    name: string;
    email: string;
    role: string;
    hierarchyLevel: number;
    company: string;
    password?: string;
  }) => {
    return usersDb.addUser(user);
  },

  deleteUser: async (id: string) => {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch (e) {
      console.error("Prisma error deleting user", e);
      return false;
    }
  },

  updateUserStatus: async (id: string, status: string) => {
    try {
      return await prisma.user.update({
        where: { id },
        data: { status },
      });
    } catch (e) {
      console.error("Prisma error updating user status", e);
      throw e;
    }
  },

  updateUserRole: async (id: string, role: string) => {
    try {
      return await prisma.user.update({
        where: { id },
        data: { role },
      });
    } catch (e) {
      console.error("Prisma error updating user role", e);
      throw e;
    }
  },

  isMfaEnabled: async (): Promise<boolean> => {
    const value = await getSystemConfig("mfaEnabled");
    return value === "true";
  },

  getUserMfa: async (userId: string): Promise<MockUserMfa | null> => {
    try {
      const mfa = await prisma.userMfa.findUnique({
        where: { userId },
      });
      if (mfa) {
        return {
          id: mfa.id,
          userId: mfa.userId,
          secret: mfa.secret,
          enabled: mfa.enabled,
          createdAt: mfa.createdAt,
          updatedAt: mfa.updatedAt,
        };
      }
      return null;
    } catch (e) {
      console.error("Prisma error fetching user MFA", e);
      return null;
    }
  },

  setUserMfa: async (userId: string, secret: string, enabled: boolean): Promise<MockUserMfa> => {
    try {
      const existing = await prisma.userMfa.findUnique({
        where: { userId },
      });
      if (existing) {
        const updated = await prisma.userMfa.update({
          where: { userId },
          data: { secret, enabled },
        });
        return {
          id: updated.id,
          userId: updated.userId,
          secret: updated.secret,
          enabled: updated.enabled,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      }
      const created = await prisma.userMfa.create({
        data: { userId, secret, enabled },
      });
      return {
        id: created.id,
        userId: created.userId,
        secret: created.secret,
        enabled: created.enabled,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    } catch (e) {
      console.error("Prisma error setting user MFA", e);
      throw e;
    }
  },
};
