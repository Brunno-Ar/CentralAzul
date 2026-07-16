import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  validateRequest,
  validateParams,
  updateMenuPermissionSchema,
  createMenuPermissionSchema,
  deleteMenuPermissionSchema,
} from "@/lib/validation";

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

    const { href, ...updates } = validation.data;

    const updated = await db.updateMenuPermission(href, updates);
    if (!updated) {
      return NextResponse.json({ error: "Permissao nao encontrada" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "ALTERAR_MENU_PERMISSAO", `Alterou permissao do menu ${href}: ${JSON.stringify(updates)}`, ip, userAgent);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar permissao de menu:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

async function handlePost(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }
    const user = session.user as SessionUser;
    if ((user.hierarchyLevel ?? 99) !== 1) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const validation = await validateRequest(request, createMenuPermissionSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { href, name, minLevel } = validation.data;
    const created = await db.createMenuPermission(validation.data);
    if (!created) {
      return NextResponse.json({ error: "Nao foi possivel criar a permissao" }, { status: 500 });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "CRIAR_MENU_PERMISSAO", `Criou permissao do menu ${href} (${name}) com nivel minimo ${minLevel}`, ip, userAgent);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar permissao de menu:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

async function handleDelete(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }
    const user = session.user as SessionUser;
    if ((user.hierarchyLevel ?? 99) !== 1) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const href = searchParams.get("href");
    const paramsValidation = validateParams({ href: href || undefined }, deleteMenuPermissionSchema);
    if (!paramsValidation.success) {
      return paramsValidation.error;
    }

    const success = await db.deleteMenuPermission(paramsValidation.data.href);
    if (!success) {
      return NextResponse.json({ error: "Permissao nao encontrada" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "EXCLUIR_MENU_PERMISSAO", `Removeu permissao do menu ${paramsValidation.data.href}`, ip, userAgent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar permissao de menu:", error);
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

export async function POST(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handlePost(request);
}

export async function DELETE(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handleDelete(request);
}
