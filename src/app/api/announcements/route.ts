import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, MockAnnouncement, MockAnnouncementRead } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { 
  validateRequest, 
  validateSearchParams, 
  paginationSchema,
  createAnnouncementSchema 
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

async function handleGet(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    void user.company;

    // Validate pagination
    const paginationValidation = validateSearchParams(
      request.nextUrl.searchParams,
      paginationSchema
    );
    if (!paginationValidation.success) {
      return paginationValidation.error;
    }

    // Buscar do banco
    let announcements: Array<
      { targetCompanies: string | null } & Omit<
        MockAnnouncement,
        "targetCompanies"
      >
    > = [];
    if (db.getAnnouncements) {
      announcements = await db.getAnnouncements(user.hierarchyLevel, user.company);
    }

    // Filtrar por empresa, expiração e status ativo
    const now = new Date();
    const filtered = announcements
      .filter((a) => a.isActive)
      .filter((a) => !a.expiresAt || new Date(a.expiresAt) > now)

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
    if (db.getAnnouncementReadsByUser) {
      const reads = await db.getAnnouncementReadsByUser(userId);
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

async function handlePost(request: NextRequest) {
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

    // Validate request body with Zod
    const validation = await validateRequest(request, createAnnouncementSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { title, content, priority, targetCompanies, expiresAt, isPinned } = validation.data;

    if (!db.createAnnouncement) {
      return NextResponse.json(
        { error: "Função não implementada" },
        { status: 500 },
      );
    }

    const newAnnouncement = await db.createAnnouncement({
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
    await db.addLog(
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

// Use method-aware rate limiting
export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;
  return handleGet(request);
}

export async function POST(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "CSRF token invalido" }, { status: 403 });
  }

  return handlePost(request);
}
