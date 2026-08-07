import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { fetchPortalReport, fetchPortalContas } from "@/lib/portal-api";
import { 
  validateRequest, 
  validateSearchParams, 
  paginationSchema,
  createBusinessUnitSchema 
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

async function handleGet(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const _user = session.user as SessionUser;

    // Validate pagination
    const paginationValidation = validateSearchParams(
      request.nextUrl.searchParams,
      paginationSchema
    );
    if (!paginationValidation.success) {
      return paginationValidation.error;
    }

    if (!db.getBusinessUnits) {
      return NextResponse.json([]);
    }

    const businessUnits = await db.getBusinessUnits();

    // Tenta obter contas e métricas do portal em background
    let portalMap: Record<string, any> = {};
    try {
      const contas = await fetchPortalContas();
      await Promise.all(
        contas.map(async (c) => {
          try {
            const report = await fetchPortalReport(c.id, "mes");
            portalMap[c.id] = report;
          } catch (e) {
            console.error(`Erro ao carregar relatorio portal ${c.id}:`, e);
          }
        })
      );
    } catch (err) {
      console.warn("Portal nao disponivel durante GET /api/business-units:", err);
    }

    // Enrich business units with live portal data if available
    const enrichedUnits = businessUnits.map((bu: any) => {
      // Tenta combinar por portalId ou por slug/id aproximado
      const pId =
        bu.portalId ||
        (bu.slug === "borgo-del-vino" ? "o-borgo" :
         bu.slug === "vinicola-familia-eloy" ? "vinicola" :
         bu.slug === "hotel-borgo-del-vino" ? "hotel" :
         bu.slug === "azul-incorporacoes" ? "azul" :
         bu.slug === "restaurante-don-eloy" ? "don-eloy" : null);

      const portalReport = pId ? portalMap[pId] : null;
      if (!portalReport) return bu;

      const ig = portalReport.instagram;
      const media = portalReport.media;
      const vendas = portalReport.vendas;

      // Meta data sintese do portal
      const metaItem = ig || media ? {
        id: `portal-meta-${bu.id}`,
        businessUnitId: bu.id,
        date: new Date().toISOString(),
        platform: "instagram",
        followersCount: ig?.seguidores || 0,
        followingCount: 0,
        postsCount: 0,
        engagementRate: media?.ctr || 0,
        reach: media?.reach || 0,
        impressions: media?.impressions || 0,
        createdAt: new Date().toISOString()
      } : null;

      // Faturamento do portal se houver
      const revenueItem = vendas?.faturamento ? {
        id: `portal-rev-${bu.id}`,
        businessUnitId: bu.id,
        period: portalReport.periodo?.label || "Mês Atual",
        amount: vendas.faturamento,
        currency: "BRL",
        type: "gross",
        source: "portal",
        notes: "Sincronizado do Portal CP Digital",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : null;

      return {
        ...bu,
        portalId: pId,
        portalReport,
        metaData: metaItem ? [metaItem, ...(bu.metaData || [])] : bu.metaData,
        revenueData: revenueItem ? [revenueItem, ...(bu.revenueData || [])] : bu.revenueData,
      };
    });

    // Filter by user's company if not admin
    const userLevel = _user.hierarchyLevel || 3;
    const userCompany = _user.company;

    const filtered =
      userLevel <= 1
        ? enrichedUnits
        : enrichedUnits.filter(
            (bu: { company: string }) =>
              bu.company === userCompany || bu.company === "CENTRAL"
          );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Erro ao listar unidades de negócio:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

async function handlePost(request: NextRequest) {
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

    // Apenas ADMIN pode criar
    if (userLevel > 1) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 },
      );
    }

    // Validate request body with Zod
    const validation = await validateRequest(request, createBusinessUnitSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { 
      name, description, logo, coverImage, 
      address, phone, email, website, isActive, order, showOnHome 
    } = validation.data;

    // Gerar slug automaticamente a partir do nome
    const slug = validation.data.slug || name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Unidade de Negocio = Empresa (company recebe o slug da unidade)
    const company = slug;

    if (!db.createBusinessUnit) {
      return NextResponse.json(
        { error: "Funcao nao implementada" },
        { status: 500 },
      );
    }

    const newBusinessUnit = await db.createBusinessUnit({
      name,
      slug,
      company,
      description: description || "",
      logo: logo || "",
      coverImage: coverImage || "",
      address: address || "",
      phone: phone || "",
      email: email || "",
      website: website || "",
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      showOnHome: showOnHome !== undefined ? showOnHome : true,
    } as any);

    // Log de auditoria
    await db.addLog(
      user.id,
      "CRIAR_UNIDADE_NEGOCIO",
      `Criou unidade de negocio: ${name} (${slug})`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser",
    );

    return NextResponse.json(newBusinessUnit);
  } catch (error) {
    console.error("Erro ao criar unidade de negócio:", error);
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
  return handlePost(request);
}
