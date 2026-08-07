import type { MockRoleConfig } from "../db";

export const mockRoles: MockRoleConfig[] = globalThis.__mockRoles ?? (globalThis.__mockRoles = [
  {
    id: "role-admin",
    name: "ADMIN",
    displayName: "Direcao Geral",
    hierarchyLevel: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "role-coordinator",
    name: "COORDINATOR",
    displayName: "Gerencia",
    hierarchyLevel: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "role-viewer",
    name: "VIEWER",
    displayName: "Operacional",
    hierarchyLevel: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
