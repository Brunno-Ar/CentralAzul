import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim } from "@/lib/db";
import { SessionUser } from "@/types/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;

    // Apenas ADMIN e COORDINATOR podem editar
    if (userLevel > 2) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores e gerentes." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updatedAnn = await dbSim.updateAnnouncement(id, body);

    if (!updatedAnn) {
      return NextResponse.json(
        { error: "Anúncio não encontrado" },
        { status: 404 },
      );
    }

    // Log de auditoria
    await dbSim.addLog(
      user.id,
      "ATUALIZAR_ANUNCIO",
      `Atualizou anúncio: ${updatedAnn.title}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser",
    );

    return NextResponse.json(updatedAnn);
  } catch (error) {
    console.error("Erro ao atualizar anúncio:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const { id } = await params;

    const deleted = await dbSim.deleteAnnouncement(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Anúncio não encontrado" },
        { status: 404 },
      );
    }

    // Log de auditoria
    await dbSim.addLog(
      user.id,
      "DELETAR_ANUNCIO",
      `Removeu anúncio: ${id}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser",
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar anúncio:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
