import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  validateParams,
  validateRequest,
  createLevelSchema,
  deleteLevelSchema,
  updateLevelSchema,
} from "@/lib/validation";

async function handleGet() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }
    const levels = await db.getLevels();
    return NextResponse.json(levels);
  } catch (error) {
    console.error("Erro ao carregar niveis:", error);
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

    const { level, name } = await request.json();
    if (level === undefined || !name) {
      return NextResponse.json({ error: "Nivel e nome sao obrigatorios" }, { status: 400 });
    }

    const validation = createLevelSchema.safeParse({ level: typeof level === "string" ? parseInt(level, 10) : level, name });
    if (!validation.success) {
      const errorMessages = validation.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      return NextResponse.json({ error: "Dados invalidos", details: errorMessages }, { status: 400 });
    }

    const newLevel = await db.createLevel({ level: validation.data.level, name: validation.data.name });
    
    // Log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "CRIAR_NIVEL", `Criou o nivel de hierarquia ${validation.data.level} (${validation.data.name})`, ip, userAgent);

    return NextResponse.json(newLevel, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar nivel:", error);
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

    const validation = await validateRequest(request, updateLevelSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { id, level, name } = validation.data;

    const updated = await db.updateLevel(id, {
      ...(level !== undefined ? { level } : {}),
      ...(name !== undefined ? { name } : {}),
    });
    if (!updated) {
      return NextResponse.json({ error: "Nivel nao encontrado" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "ALTERAR_NIVEL", `Atualizou nivel ${id} (${name || ""})`, ip, userAgent);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar nivel:", error);
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
    const id = searchParams.get("id");
    const paramsValidation = validateParams({ id: id || undefined }, deleteLevelSchema);
    if (!paramsValidation.success) {
      return paramsValidation.error;
    }

    const success = await db.deleteLevel(paramsValidation.data.id);
    if (!success) {
      return NextResponse.json({ error: "Nivel nao encontrado" }, { status: 404 });
    }

    // Log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "EXCLUIR_NIVEL", `Removeu o nivel de hierarquia ID: ${paramsValidation.data.id}`, ip, userAgent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar nivel:", error);
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
