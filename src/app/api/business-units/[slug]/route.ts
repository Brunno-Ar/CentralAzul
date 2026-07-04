import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateRequest, updateBusinessUnitBySlugSchema } from "@/lib/validation";
import { validateCsrf } from "@/lib/csrf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const user = session.user as SessionUser;
    void user.hierarchyLevel;
    void user.company;

    if (!db.getBusinessUnitBySlug) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const businessUnit = await db.getBusinessUnitBySlug(slug);

    if (!businessUnit) {
      return NextResponse.json(
        { error: "Unidade não encontrada" },
        { status: 404 },
      );
    }



    return NextResponse.json(businessUnit);
  } catch (error) {
    console.error("Erro ao buscar unidade de negócio:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "CSRF token invalido" }, { status: 403 });
  }

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;

    // Apenas ADMIN pode editar
    if (userLevel > 1) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 },
      );
    }

    const { slug } = await params;
    const validation = await validateRequest(request, updateBusinessUnitBySlugSchema);
    if (!validation.success) {
      return validation.error;
    }

    if (!db.updateBusinessUnit) {
      return NextResponse.json(
        { error: "Função não implementada" },
        { status: 500 },
      );
    }

    // Find the business unit first
    const businessUnit = await db.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json(
        { error: "Unidade não encontrada" },
        { status: 404 },
      );
    }

    const updated = await db.updateBusinessUnit(businessUnit.id, validation.data);

    if (!updated) {
      return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
    }

    // Log de auditoria
    await db.addLog(
      user.id,
      "ATUALIZAR_UNIDADE_NEGOCIO",
      `Atualizou unidade de negócio: ${updated.name}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser",
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar unidade de negócio:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "CSRF token invalido" }, { status: 403 });
  }

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;

    // Apenas ADMIN pode deletar
    if (userLevel > 1) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 },
      );
    }

    const { slug } = await params;

    if (!db.getBusinessUnitBySlug || !db.deleteBusinessUnit) {
      return NextResponse.json(
        { error: "Função não implementada" },
        { status: 500 },
      );
    }

    const businessUnit = await db.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json(
        { error: "Unidade não encontrada" },
        { status: 404 },
      );
    }

    const deleted = await db.deleteBusinessUnit(businessUnit.id);

    if (!deleted) {
      return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
    }

    // Log de auditoria
    await db.addLog(
      user.id,
      "DELETAR_UNIDADE_NEGOCIO",
      `Removeu unidade de negócio: ${businessUnit.name}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser",
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar unidade de negócio:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
