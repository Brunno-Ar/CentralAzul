import type { MockAuditLog } from "../db";

export const mockLogs: MockAuditLog[] = globalThis.__mockLogs ?? (globalThis.__mockLogs = [
  {
    id: "log-1",
    userId: "user-central-admin",
    userName: "Administrador Central",
    action: "LOGIN",
    details: "Usuario logou no sistema",
    ipAddress: "127.0.0.1",
    userAgent: "Browser",
    createdAt: new Date(),
  },
]);
