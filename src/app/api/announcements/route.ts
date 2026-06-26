import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim, MockAnnouncement, MockAnnouncementRead } from "@/lib/db";
import { SessionUser } from "@/types/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userCompany = user.company;

    // Buscar do banco
    let announcements: Array<
      { targetCompanies: string | null } & Omit<
        MockAnnouncement,
        "targetCompanies"
      >
    > = [];
    if (dbSim.getAnnouncements) {
      announcements = await dbSim.getAnnouncements();
    }

    // Filtrar por empresa, expiração e status ativo
    const now = new Date();
    const filtered = announcements
      .filter((a) => a.isActive)
      .filter((a) => !a.expiresAt || new Date(a.expiresAt) > now)
      .filter((a) => {
        // Filtrar por empresa alvo
        if (a.targetCompanies && a.targetCompanies.trim()) {
          const targetCompanies = a.targetCompanies
            .split(",")
            .map((c: string) => c.trim());
          if (!targetCompanies.includes(userCompany)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Fixados primeiro, depois por data de criação
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

    // Verificar quais já foram lidos
    const userId = user.id;
    const readIds = new Set<string>();
    if (dbSim.getAnnouncementReadsByUser) {
      const reads = await dbSim.getAnnouncementReadsByUser(userId);
      reads.forEach((r: MockAnnouncementRead) => readIds.add(r.announcementId));
    }

    const result = filtered.map((a) => ({
      ...a,
      read: readIds.has(a.id),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao listar anúncios:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;

    // Apenas ADMIN e COORDINATOR podem criar
    if (userLevel > 2) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores e gerentes." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { title, content, priority, targetCompanies, expiresAt, isPinned } =
      body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Título e conteúdo são obrigatórios" },
        { status: 400 },
      );
    }

    if (!dbSim.addAnnouncement) {
      return NextResponse.json(
        { error: "Função não implementada" },
        { status: 500 },
      );
    }

    const newAnnouncement = await dbSim.addAnnouncement({
      title,
      content,
      priority: priority || "INFO",
      targetCompanies: targetCompanies || "",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isPinned: isPinned || false,
      isActive: true,
      createdById: user.id,
    });

    // Log de auditoria
    await dbSim.addLog(
      user.id,
      "CRIAR_ANUNCIO",
      `Criou anúncio: ${title} (${priority})`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser",
    );

    return NextResponse.json(newAnnouncement);
  } catch (error) {
    console.error("Erro ao criar anúncio:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
