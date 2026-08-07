import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { fetchPortalReport, fetchPortalContas } from "@/lib/portal-api";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;

    if (!dbSim.getBusinessUnits) {
      return NextResponse.json([]);
    }

    const businessUnits = await dbSim.getBusinessUnits();

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
    const userLevel = user.hierarchyLevel || 3;
    const userCompany = user.company;

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
      { status: 500 }
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

    // Apenas ADMIN pode criar
    if (userLevel > 1) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      company,
      portalId,
      description,
      logo,
      coverImage,
      address,
      phone,
      email,
      website,
      isActive,
      order,
    } = body;

    if (!name || !slug || !company) {
      return NextResponse.json(
        { error: "Nome, slug e empresa são obrigatórios" },
        { status: 400 }
      );
    }

    if (!dbSim.addBusinessUnit) {
      return NextResponse.json(
        { error: "Função não implementada" },
        { status: 500 }
      );
    }

    const newBusinessUnit = await dbSim.addBusinessUnit({
      name,
      slug,
      company,
      portalId: portalId || undefined,
      description: description || "",
      logo: logo || "",
      coverImage: coverImage || "",
      address: address || "",
      phone: phone || "",
      email: email || "",
      website: website || "",
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
    });

    // Log de auditoria
    await dbSim.addLog(
      user.id,
      "CRIAR_UNIDADE_NEGOCIO",
      `Criou unidade de negócio: ${name} (${company})`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser"
    );

    return NextResponse.json(newBusinessUnit);
  } catch (error) {
    console.error("Erro ao criar unidade de negócio:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
