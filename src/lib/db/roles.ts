/**
 * Camada de dados - Cargos (Roles)
 *
 * Responsavel por todas as operacoes relacionadas a cargos:
 * - getRoles
 * - addRole, createRole
 * - updateRole
 * - deleteRole
 */

import type { MockRoleConfig } from "../db";
import { prisma, isDatabaseConnected, mockRoles, mockUsers, mockPanels } from "../db";

export type { MockRoleConfig };

export const rolesDb = {
  getRoles: async () => {
    if (prisma && isDatabaseConnected()) {
      try {
        const dbRoles = await prisma.roleConfig.findMany({
          orderBy: { hierarchyLevel: "asc" },
        });
        if (dbRoles.length > 0) {
          return dbRoles.map((r) => ({
            id: r.id,
            name: r.name,
            displayName: r.displayName,
            hierarchyLevel: r.hierarchyLevel,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }));
        }

        // Seed database if roleConfigs table is empty
        for (const r of mockRoles) {
          await prisma.roleConfig.create({
            data: {
              name: r.name,
              displayName: r.displayName,
              hierarchyLevel: r.hierarchyLevel,
            },
          });
        }
        const refetched = await prisma.roleConfig.findMany({
          orderBy: { hierarchyLevel: "asc" },
        });
        return refetched.map((r) => ({
          id: r.id,
          name: r.name,
          displayName: r.displayName,
          hierarchyLevel: r.hierarchyLevel,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      } catch (e) {
        console.error("Prisma error fetching roles, falling back", e);
      }
    }
    return mockRoles;
  },

  addRole: async (role: {
    name: string;
    displayName: string;
    hierarchyLevel: number;
  }) => {
    const nameUpper = role.name.toUpperCase().replace(/\s+/g, "_");
    const newRole: MockRoleConfig = {
      id: "role-" + Math.random().toString(36).substr(2, 9),
      name: nameUpper,
      displayName: role.displayName,
      hierarchyLevel: role.hierarchyLevel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (prisma && isDatabaseConnected()) {
      try {
        const created = await prisma.roleConfig.create({
          data: {
            name: nameUpper,
            displayName: role.displayName,
            hierarchyLevel: role.hierarchyLevel,
          },
        });
        return {
          id: created.id,
          name: created.name,
          displayName: created.displayName,
          hierarchyLevel: created.hierarchyLevel,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (e) {
        console.error("Prisma error creating role, falling back", e);
      }
    }
    mockRoles.push(newRole);
    return newRole;
  },

  updateRole: async (
    id: string,
    updates: { name?: string; displayName?: string; hierarchyLevel?: number },
  ) => {
    const nameUpper = updates.name
      ? updates.name.toUpperCase().replace(/\s+/g, "_")
      : undefined;
    if (prisma && isDatabaseConnected()) {
      try {
        const origRole = await prisma.roleConfig.findUnique({
          where: { id },
        });
        const updated = await prisma.$transaction(async (tx) => {
          const updatedRole = await tx.roleConfig.update({
            where: { id },
            data: {
              ...(nameUpper ? { name: nameUpper } : {}),
              ...(updates.displayName
                ? { displayName: updates.displayName }
                : {}),
              ...(updates.hierarchyLevel !== undefined
                ? { hierarchyLevel: updates.hierarchyLevel }
                : {}),
            },
          });

          if (origRole && nameUpper && origRole.name !== nameUpper) {
            // Update users
            await tx.user.updateMany({
              where: { role: origRole.name },
              data: { role: nameUpper },
            });
            // Update system panels
            await tx.systemPanel.updateMany({
              where: { minRole: origRole.name },
              data: { minRole: nameUpper },
            });
          }
          return updatedRole;
        });
        return {
          id: updated.id,
          name: updated.name,
          displayName: updated.displayName,
          hierarchyLevel: updated.hierarchyLevel,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      } catch (e) {
        console.error("Prisma error updating role, falling back", e);
      }
    }
    const role = mockRoles.find((r) => r.id === id);
    if (role) {
      const oldName = role.name;
      const oldRole = { ...role };
      try {
        if (nameUpper) role.name = nameUpper;
        if (updates.displayName) role.displayName = updates.displayName;
        if (updates.hierarchyLevel !== undefined)
          role.hierarchyLevel = updates.hierarchyLevel;
        role.updatedAt = new Date();

        if (nameUpper && oldName !== nameUpper) {
          // Update mock users role
          for (const u of mockUsers) {
            if (u.role === oldName) u.role = nameUpper;
          }
          // Update mock panels minRole
          for (const p of mockPanels) {
            if (p.minRole === oldName) p.minRole = nameUpper;
          }
        }
        return role;
      } catch (e) {
        Object.assign(role, oldRole);
        throw e;
      }
    }
    return null;
  },

  deleteRole: async (id: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        const origRole = await prisma.roleConfig.findUnique({
          where: { id },
        });
        if (origRole) {
          await prisma.$transaction(async (tx) => {
            // Reassign users of this role to VIEWER (or another base role) before deletion
            await tx.user.updateMany({
              where: { role: origRole.name },
              data: { role: "VIEWER" },
            });
            // Reassign system panels
            await tx.systemPanel.updateMany({
              where: { minRole: origRole.name },
              data: { minRole: "VIEWER" },
            });

            await tx.roleConfig.delete({ where: { id } });
          });
          return true;
        }
      } catch (e) {
        console.error("Prisma error deleting role, falling back", e);
      }
    }
    const index = mockRoles.findIndex((r) => r.id === id);
    if (index !== -1) {
      const deletedName = mockRoles[index].name;
      const deletedRole = mockRoles[index];
      const affectedUsers: typeof mockUsers = [];
      const affectedPanels: typeof mockPanels = [];
      try {
        mockRoles.splice(index, 1);
        // Reassign mock users
        for (const u of mockUsers) {
          if (u.role === deletedName) {
            u.role = "VIEWER";
            affectedUsers.push(u);
          }
        }
        // Reassign mock panels
        for (const p of mockPanels) {
          if (p.minRole === deletedName) {
            p.minRole = "VIEWER";
            affectedPanels.push(p);
          }
        }
        return true;
      } catch (e) {
        mockRoles.splice(index, 0, deletedRole);
        for (const u of affectedUsers) {
          u.role = deletedName;
        }
        for (const p of affectedPanels) {
          p.minRole = deletedName;
        }
        throw e;
      }
    }
    return false;
  },

  createRole: async (role: {
    name: string;
    displayName: string;
    hierarchyLevel: number;
  }) => {
    return rolesDb.addRole(role);
  },
};
