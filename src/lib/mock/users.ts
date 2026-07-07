import { Company } from "@prisma/client";
import type { MockUser } from "../db";

export const mockUsers: MockUser[] = globalThis.__mockUsers ?? (globalThis.__mockUsers = [
  {
    id: "user-central-admin",
    name: "Administrador Central",
    email: "admin@grupoazul.com.br",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    password: "admin12345",
    role: "ADMIN",
    hierarchyLevel: 1,
    company: Company.CENTRAL,
    status: "ACTIVE",
    createdAt: new Date(),
  },
  {
    id: "user-central-coordinator",
    name: "Gerente Central",
    email: "gerente@grupoazul.com.br",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
    password: "gerente123",
    role: "COORDINATOR",
    hierarchyLevel: 2,
    company: Company.CENTRAL,
    status: "ACTIVE",
    createdAt: new Date(),
  },
  {
    id: "user-central-viewer",
    name: "Operador Central",
    email: "operador@grupoazul.com.br",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
    password: "operador123",
    role: "VIEWER",
    hierarchyLevel: 3,
    company: Company.CENTRAL,
    status: "ACTIVE",
    createdAt: new Date(),
  },
]);
