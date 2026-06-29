import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { validateRequest, validateParams, updateAnnouncementSchema, deleteAnnouncementSchema } from "@/lib/validation";

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

    // Fetch original announcement first to verify existence and ownership
    const announcement = await db.getAnnouncements().then(list => list.find(a => a.id === id));
    if (!announcement) {
      return NextResponse.json(
        { error: "Anúncio não encontrado" },
        { status: 404 },
      );
    }

    // Access check: non-admins can only edit announcements they created
    if (userLevel > 1 && announcement.createdById !== user.id) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas o criador do anúncio ou administradores podem editá-lo." },
        { status: 403 },
      );
    }

    // Validate request body with Zod
    const validation = await validateRequest(request, updateAnnouncementSchema);
    if (!validation.success) {
      return validation.error;
    }

    // Ensure ID matches
    const data = { ...validation.data, id };
    if (data.id !== id) {
      return NextResponse.json(
        { error: "ID não corresponde" },
        { status: 400 },
      );
    }

    const updatedAnn = await db.updateAnnouncement(id, {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : data.expiresAt === null ? null : undefined,
    });

    if (!updatedAnn) {
      return NextResponse.json(
        { error: "Anúncio não encontrado" },
        { status: 404 },
      );
    }

    // Log de auditoria
    await db.addLog(
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

    // Validate params with Zod
    const paramsValidation = validateParams({ id }, deleteAnnouncementSchema);
    if (!paramsValidation.success) {
      return paramsValidation.error;
    }

    const deleted = await db.deleteAnnouncement(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Anúncio não encontrado" },
        { status: 404 },
      );
    }

    // Log de auditoria
    await db.addLog(
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
