import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  validateRequest,
  validateParams,
  createDocumentTypeSchema,
  updateDocumentTypeSchema,
  deleteDocumentTypeSchema,
} from "@/lib/validation";

async function handleGet() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }
    const types = await db.getDocumentTypes();
    return NextResponse.json(types);
  } catch (error) {
    console.error("Erro ao carregar tipos de documentos:", error);
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

    const validation = await validateRequest(request, createDocumentTypeSchema);
    if (!validation.success) {
      return validation.error;
    }

    const created = await db.createDocumentType(validation.data);
    if (!created) {
      return NextResponse.json({ error: "Nao foi possivel criar o tipo de documento" }, { status: 500 });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "CRIAR_TIPO_DOCUMENTO", `Criou tipo de documento ${validation.data.name}`, ip, userAgent);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar tipo de documento:", error);
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

    const validation = await validateRequest(request, updateDocumentTypeSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { id, ...updates } = validation.data;
    const updated = await db.updateDocumentType(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Tipo de documento nao encontrado" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "ALTERAR_TIPO_DOCUMENTO", `Alterou tipo de documento ${id} (${updates.name || ''})`, ip, userAgent);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar tipo de documento:", error);
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
    const paramsValidation = validateParams({ id: id || undefined }, deleteDocumentTypeSchema);
    if (!paramsValidation.success) {
      return paramsValidation.error;
    }

    const success = await db.deleteDocumentType(paramsValidation.data.id);
    if (!success) {
      return NextResponse.json({ error: "Tipo de documento nao encontrado" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await db.addLog(user.id, "EXCLUIR_TIPO_DOCUMENTO", `Removeu tipo de documento ${paramsValidation.data.id}`, ip, userAgent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar tipo de documento:", error);
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
