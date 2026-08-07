import type { MockLevelConfig, MockMenuPermission } from "../db";

export const mockLevels: MockLevelConfig[] = globalThis.__mockLevels ?? (globalThis.__mockLevels = [
  { id: "lvl-1", level: 1, name: "Direcao Geral", createdAt: new Date() },
  { id: "lvl-2", level: 2, name: "Gerencia / Coordenacao", createdAt: new Date() },
  { id: "lvl-3", level: 3, name: "Operacional", createdAt: new Date() },
]);

export const mockMenuPermissions: MockMenuPermission[] = globalThis.__mockMenuPermissions ?? (globalThis.__mockMenuPermissions = [
  { href: "/dashboard", name: "Painel Principal", minLevel: 3 },
  { href: "/dashboard/ferramentas", name: "Ferramentas", minLevel: 3 },
  { href: "/dashboard/comunicados", name: "Comunicados", minLevel: 3 },
  { href: "/dashboard/unidades", name: "Unidades de Negocio", minLevel: 3 },
  { href: "/dashboard/documentos", name: "Drive de Arquivos", minLevel: 3 },
  { href: "/dashboard/seguranca", name: "Seguranca & Niveis", minLevel: 1 },
  { href: "/dashboard/configuracoes", name: "Configuracoes", minLevel: 99 },
]);
