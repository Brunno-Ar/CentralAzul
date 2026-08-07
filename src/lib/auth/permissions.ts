import { prisma, isDatabaseConnected } from "@/lib/db";

/**
 * Verifica se um cargo possui permissao para realizar uma determinada acao.
 * O cargo ADMIN tem permissao total automatica.
 *
 * @param role Nome do cargo (ex: ADMIN, COORDINATOR, VIEWER)
 * @param action Nome da acao (ex: panel:create, document:upload)
 * @returns true se tiver permissao, false caso contrario
 */
export async function hasPermission(role: string, action: string): Promise<boolean> {
  if (role === "ADMIN") {
    return true;
  }

  if (prisma && isDatabaseConnected()) {
    try {
      const perm = await prisma.rolePermission.findUnique({
        where: {
          role_action: {
            role,
            action,
          },
        },
      });
      return !!perm;
    } catch (e) {
      console.error("Erro ao verificar permissao no banco de dados:", e);
    }
  }

  // Fallbacks estaticos para resiliencia do sistema
  const fallbackPermissions: Record<string, string[]> = {
    COORDINATOR: ["document:upload", "announcement:create", "panel:view"],
    VIEWER: ["panel:view", "announcement:read", "document:view"],
  };

  const allowedActions = fallbackPermissions[role];
  return allowedActions ? allowedActions.includes(action) : false;
}
