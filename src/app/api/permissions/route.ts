import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateRequest, createRolePermissionSchema } from "@/lib/validation";

async function handleGet() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const permissions = await db.getRolePermissions();
    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Erro ao listar permissoes:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

async function handlePost(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const userLevel = (session.user as SessionUser).hierarchyLevel || 3;
    const userRole = (session.user as SessionUser).role || "VIEWER";

    if (userLevel !== 1 && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    const validation = await validateRequest(request, createRolePermissionSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { role, action } = validation.data;
    const newPermission = await db.createRolePermission(role, action);

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(
      (session.user as SessionUser).id,
      "CONFIGURAR_PERMISSAO",
      `Associou a permissao '${action}' ao cargo '${role}'.`,
      ip,
      userAgent
    );

    return NextResponse.json(newPermission, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar permissao:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

async function handleDelete(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const userLevel = (session.user as SessionUser).hierarchyLevel || 3;
    const userRole = (session.user as SessionUser).role || "VIEWER";

    if (userLevel !== 1 && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");
    const action = searchParams.get("action");

    if (!role || !action) {
      return NextResponse.json({ error: "Cargo e Acao sao obrigatorios" }, { status: 400 });
    }

    const success = await db.deleteRolePermission(role, action);
    if (!success) {
      return NextResponse.json({ error: "Permissao nao encontrada" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(
      (session.user as SessionUser).id,
      "CONFIGURAR_PERMISSAO",
      `Removeu a permissao '${action}' do cargo '${role}'.`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover permissao:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;
  return handleGet();
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
