import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim } from "@/lib/db";
import { SessionUser } from "@/types/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;
    const userCompany = user.company;

    if (!dbSim.getBusinessUnitBySlug) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const businessUnit = await dbSim.getBusinessUnitBySlug(slug);

    if (!businessUnit) {
      return NextResponse.json(
        { error: "Unidade não encontrada" },
        { status: 404 },
      );
    }

    // Check access
    if (
      userLevel > 1 &&
      businessUnit.company !== userCompany &&
      businessUnit.company !== "CENTRAL"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
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
    const body = await request.json();

    if (!dbSim.updateBusinessUnit) {
      return NextResponse.json(
        { error: "Função não implementada" },
        { status: 500 },
      );
    }

    // Find the business unit first
    const businessUnit = await dbSim.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json(
        { error: "Unidade não encontrada" },
        { status: 404 },
      );
    }

    const updated = await dbSim.updateBusinessUnit(businessUnit.id, body);

    if (!updated) {
      return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
    }

    // Log de auditoria
    await dbSim.addLog(
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

    if (!dbSim.getBusinessUnitBySlug || !dbSim.deleteBusinessUnit) {
      return NextResponse.json(
        { error: "Função não implementada" },
        { status: 500 },
      );
    }

    const businessUnit = await dbSim.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json(
        { error: "Unidade não encontrada" },
        { status: 404 },
      );
    }

    const deleted = await dbSim.deleteBusinessUnit(businessUnit.id);

    if (!deleted) {
      return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
    }

    // Log de auditoria
    await dbSim.addLog(
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
