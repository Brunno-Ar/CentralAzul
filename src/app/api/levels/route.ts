import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";

async function handleGet(request: NextRequest) {
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

    const newLevel = await db.createLevel({ level: parseInt(level, 10), name });
    
    // Log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "CRIAR_NIVEL", `Criou o nivel de hierarquia ${level} (${name})`, ip, userAgent);

    return NextResponse.json(newLevel, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar nivel:", error);
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
    if (!id) {
      return NextResponse.json({ error: "ID e obrigatorio" }, { status: 400 });
    }

    const success = await db.deleteLevel(id);
    if (!success) {
      return NextResponse.json({ error: "Nivel nao encontrado" }, { status: 404 });
    }

    // Log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "EXCLUIR_NIVEL", `Removeu o nivel de hierarquia ID: ${id}`, ip, userAgent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar nivel:", error);
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

export async function DELETE(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;
  return handleDelete(request);
}
