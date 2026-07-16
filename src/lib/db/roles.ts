/**
 * Camada de dados - Cargos (Roles)
 *
 * Responsavel por todas as operacoes relacionadas a cargos.
 */

import { prisma } from "../db";

export const rolesDb = {
  getRoles: async () => {
    try {
      const dbRoles = await prisma.roleConfig.findMany({
        orderBy: { hierarchyLevel: "asc" },
      });
      return dbRoles;
    } catch (e) {
      console.error("Prisma error fetching roles", e);
      return [];
    }
  },

  addRole: async (role: {
    name: string;
    displayName: string;
    hierarchyLevel: number;
  }) => {
    const nameUpper = role.name.toUpperCase().replace(/\s+/g, "_");
    try {
      const created = await prisma.roleConfig.create({
        data: {
          name: nameUpper,
          displayName: role.displayName,
          hierarchyLevel: role.hierarchyLevel,
        },
      });
      return created;
    } catch (e) {
      console.error("Prisma error creating role", e);
      throw e;
    }
  },

  updateRole: async (
    id: string,
    updates: { name?: string; displayName?: string; hierarchyLevel?: number },
  ) => {
    const nameUpper = updates.name
      ? updates.name.toUpperCase().replace(/\s+/g, "_")
      : undefined;
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
      return updated;
    } catch (e) {
      console.error("Prisma error updating role", e);
      throw e;
    }
  },

  deleteRole: async (id: string) => {
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
      return false;
    } catch (e) {
      console.error("Prisma error deleting role", e);
      throw e;
    }
  },

  createRole: async (role: {
    name: string;
    displayName: string;
    hierarchyLevel: number;
  }) => {
    return rolesDb.addRole(role);
  },
};
