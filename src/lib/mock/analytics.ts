import type { MockAuditLog } from "../db";

export const mockLogs: MockAuditLog[] = globalThis.__mockLogs ?? (globalThis.__mockLogs = [
  {
    id: "log-1",
    userId: "user-director",
    userName: "Diretor Grupo Azul",
    action: "LOGIN",
    details: "Autenticacao realizada com sucesso via Outlook (Entra ID)",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: "log-2",
    userId: "user-director",
    userName: "Diretor Grupo Azul",
    action: "ALTERAR_HIERARQUIA",
    details:
      "Alterou o nivel de acesso de 'Coordenador Maple Bear' para Nivel 2",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: "log-3",
    userId: "user-borgo",
    userName: "Gerente Borgo del Vin",
    action: "ACESSO_PAINEL",
    details: "Acessou o painel 'Borgo del Vin - CRM & Vendas'",
    ipAddress: "187.32.45.122",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15",
    createdAt: new Date(Date.now() - 20 * 60 * 1000),
  },
]);
