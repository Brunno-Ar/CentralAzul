import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateSearchParams, paginationSchema } from "@/lib/validation";
import { prisma, isDatabaseConnected } from "@/lib/db";

async function handleGet(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;
    const userCompany = user.company;

    // RLS: Operacionais (Nível 3) só podem ver seus próprios logs de atividade
    // Gerentes (Nível 2) veem os logs dos usuários de sua mesma empresa
    // Diretores (Nível 1) veem tudo
    let rlsFilter: any = {};
    if (userLevel === 3) {
      rlsFilter = { userId: user.id };
    } else if (userLevel === 2 && userCompany) {
      rlsFilter = { user: { company: userCompany } };
    }

    // Parâmetros de filtro
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";
    const targetUserId = searchParams.get("userId") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    if (prisma && isDatabaseConnected()) {
      // Montar filtros dinâmicos
      const andFilters: any[] = [{ ...rlsFilter }];

      if (search) {
        andFilters.push({
          OR: [
            { details: { contains: search } },
            { action: { contains: search } },
            { user: { name: { contains: search } } },
          ],
        });
      }

      if (action) {
        andFilters.push({ action });
      }

      if (targetUserId) {
        andFilters.push({ userId: targetUserId });
      }

      const where = { AND: andFilters };

      const [dbLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: { user: true },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      const items = dbLogs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.user.name || "Usuario",
        userEmail: l.user.email || "",
        userImage: l.user.image || "",
        action: l.action,
        details: l.details,
        ipAddress: l.ipAddress || "",
        userAgent: l.userAgent || "",
        createdAt: l.createdAt,
      }));

      return NextResponse.json({
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Fallback Mock se não conectado
    const allLogs = await db.getAuditLogs(userLevel, userCompany);
    let filtered = [...allLogs];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.details.toLowerCase().includes(searchLower) ||
          l.action.toLowerCase().includes(searchLower) ||
          l.userName.toLowerCase().includes(searchLower)
      );
    }

    if (action) {
      filtered = filtered.filter((l) => l.action === action);
    }

    if (targetUserId) {
      filtered = filtered.filter((l) => l.userId === targetUserId);
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erro ao carregar timeline de atividades:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;
  return handleGet(request);
}
