import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateRequest, updateMenuPermissionSchema } from "@/lib/validation";

async function handleGet() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }
    const permissions = await db.getMenuPermissions();
    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Erro ao carregar permissoes de menu:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

async function handlePut(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }
    const user = session.user as SessionUser;
    if ((user.hierarchyLevel ?? 99) !== 1) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const validation = await validateRequest(request, updateMenuPermissionSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { href, minLevel } = validation.data;

    const updated = await db.updateMenuPermission(href, minLevel);
    if (!updated) {
      return NextResponse.json({ error: "Permissao nao encontrada" }, { status: 404 });
    }

    // Log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "ALTERAR_MENU_PERMISSAO", `Alterou permissao do menu ${href} para nivel minimo ${minLevel}`, ip, userAgent);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar permissao de menu:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;
  return handleGet();
}

export async function PUT(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handlePut(request);
}
