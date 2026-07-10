/**
 * Camada de dados - Usuarios
 *
 * Responsavel por todas as operacoes relacionadas a usuarios:
 * - getUsers, getUserByEmail, getUserById
 * - updateUserHierarchy, updateUserProfile, updateUserStatus, updateUserRole
 * - addUser, createUser, deleteUser
 * - getUserMfa, setUserMfa, isMfaEnabled
 */

import type { MockUser, MockUserMfa } from "../db";
import { prisma, isDatabaseConnected, mockUsers, mockMfaUsers, getSystemConfig } from "../db";

export type { MockUser, MockUserMfa };

export const usersDb = {
  getUsers: async () => {
    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error, falling back", e);
      }
    }
    return mockUsers.map((u) => {
      const { password: _password, ...rest } = u;
      void _password;
      return rest;
    });
  },

  getUserByEmail: async (email: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.user.findUnique({
          where: { email },
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    return (
      mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      null
    );
  },

  getUserById: async (id: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.user.findUnique({
          where: { id },
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    return mockUsers.find((u) => u.id === id) || null;
  },

  updateUserHierarchy: async (
    id: string,
    role: string,
    level: number,
    status?: string,
  ) => {
    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error, falling back", e);
      }
    }
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      user.role = role;
      user.hierarchyLevel = level;
      if (status) user.status = status;
      return user;
    }
    return null;
  },

  updateUserProfile: async (
    id: string,
    data: { name?: string; image?: string; password?: string }
  ) => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.user.update({
          where: { id },
          data,
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      if (data.name !== undefined) user.name = data.name;
      if (data.image !== undefined) user.image = data.image;
      if (data.password !== undefined) user.password = data.password;
      return user;
    }
    return null;
  },

  addUser: async (user: {
    name: string;
    email: string;
    role: string;
    hierarchyLevel: number;
    company: string;
    password?: string;
  }) => {
    const newUser: MockUser = {
      ...user,
      id: "user-" + Math.random().toString(36).substr(2, 9),
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
      status: "ACTIVE",
      createdAt: new Date(),
    };
    if (prisma && isDatabaseConnected()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createData: any = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          image: newUser.image,
          password: newUser.password || null,
          role: newUser.role,
          hierarchyLevel: newUser.hierarchyLevel,
          company: newUser.company,
          status: newUser.status,
        };
        return await prisma.user.create({
          data: createData,
        });
      } catch (e) {
        console.error("Prisma error adding user, falling back", e);
      }
    }
    mockUsers.push(newUser);
    return newUser;
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
    if (prisma && isDatabaseConnected()) {
      try {
        await prisma.user.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting user, falling back", e);
      }
    }
    const idx = mockUsers.findIndex((u) => u.id === id);
    if (idx !== -1) {
      mockUsers.splice(idx, 1);
      return true;
    }
    return false;
  },

  updateUserStatus: async (id: string, status: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.user.update({
          where: { id },
          data: { status },
        });
      } catch (e) {
        console.error("Prisma error updating user status", e);
      }
    }
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      user.status = status;
      return user;
    }
    return null;
  },

  updateUserRole: async (id: string, role: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        return await prisma.user.update({
          where: { id },
          data: { role },
        });
      } catch (e) {
        console.error("Prisma error updating user role", e);
      }
    }
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      user.role = role;
      return user;
    }
    return null;
  },

  isMfaEnabled: async (): Promise<boolean> => {
    const value = await getSystemConfig("mfaEnabled");
    return value === "true";
  },

  getUserMfa: async (userId: string): Promise<MockUserMfa | null> => {
    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error fetching user MFA, falling back", e);
      }
    }
    return mockMfaUsers.find((m) => m.userId === userId) ?? null;
  },

  setUserMfa: async (userId: string, secret: string, enabled: boolean): Promise<MockUserMfa> => {
    if (prisma && isDatabaseConnected()) {
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
        console.error("Prisma error setting user MFA, falling back", e);
      }
    }
    const existing = mockMfaUsers.find((m) => m.userId === userId);
    if (existing) {
      existing.secret = secret;
      existing.enabled = enabled;
      existing.updatedAt = new Date();
      return existing;
    }
    const newMfa: MockUserMfa = {
      id: "mfa-" + Math.random().toString(36).substr(2, 9),
      userId,
      secret,
      enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockMfaUsers.push(newMfa);
    return newMfa;
  },
};
