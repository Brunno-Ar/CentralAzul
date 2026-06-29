import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { 
  validateRequest, 
  validateSearchParams, 
  validateParams,
  paginationSchema,
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

async function handleGet(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Validate pagination
    const paginationValidation = validateSearchParams(
      request.nextUrl.searchParams,
      paginationSchema
    );
    if (!paginationValidation.success) {
      return paginationValidation.error;
    }

    // Any authenticated user can list the roles to see descriptions or for selectors
    const roles = await db.getRoles();
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Erro ao listar cargos:", error);
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

    // Only Level 1 accounts can configure roles
    if (userLevel !== 1 && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    // Validate request body with Zod
    const validation = await validateRequest(request, createRoleSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { name, displayName, hierarchyLevel } = validation.data;

    const newRole = await db.createRole({ name, displayName, hierarchyLevel });

    // Log the security event
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(
      (session.user as SessionUser).id,
      "CONFIGURAR_CARGO",
      `Criou o cargo '${name}' (${displayName}) com Nivel ${hierarchyLevel}.`,
      ip,
      userAgent
    );

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

async function handlePut(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const userLevel = (session.user as SessionUser).hierarchyLevel || 3;
    const userRole = (session.user as SessionUser).role || "VIEWER";

    // Only Level 1 accounts can configure roles
    if (userLevel !== 1 && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    // Validate request body with Zod
    const validation = await validateRequest(request, updateRoleSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { id, name, displayName, hierarchyLevel } = validation.data;

    const updatedRole = await db.updateRole(id, { name, displayName, hierarchyLevel });

    // Log the security event
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(
      (session.user as SessionUser).id,
      "CONFIGURAR_CARGO",
      `Atualizou o cargo ID '${id}' para Nome: ${name || "sem alteracao"}, Display: ${displayName || "sem alteracao"}, Nivel: ${hierarchyLevel !== undefined ? hierarchyLevel : "sem alteracao"}.`,
      ip,
      userAgent
    );

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error("Erro ao atualizar cargo:", error);
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

    // Only Level 1 accounts can configure roles
    if (userLevel !== 1 && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    // Validate query params with Zod
    const paramsValidation = validateParams(
      Object.fromEntries(request.nextUrl.searchParams),
      deleteRoleSchema
    );
    if (!paramsValidation.success) {
      return paramsValidation.error;
    }

    const { id } = paramsValidation.data;

    // Safety: prevent deleting default roles like ADMIN or VIEWER if you want,
    // or allow complete editing/deletion as requested. The user said: "criar, apagar, mudar nivel, mudar nome dos niveis e editar por completo".
    const success = await db.deleteRole(id);

    if (!success) {
      return NextResponse.json({ error: "Cargo nao encontrado" }, { status: 404 });
    }

    // Log the security event
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(
      (session.user as SessionUser).id,
      "CONFIGURAR_CARGO",
      `Apagou o cargo ID '${id}'.`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao apagar cargo:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;
  return handleGet(request);
}

export async function POST(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handlePost(request);
}

export async function PUT(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handlePut(request);
}

export async function DELETE(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handleDelete(request);
}
