import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/auth/permissions";
import { SessionUser } from "@/types/auth";
import {
  validateSearchParams,
  validateRequest,
  paginationSchema,
  createPanelSchema,
  updatePanelSchema,
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const paginationValidation = validateSearchParams(
      request.nextUrl.searchParams,
      paginationSchema
    );
    if (!paginationValidation.success) {
      return paginationValidation.error;
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;

    const [panels, companies, businessUnits] = await Promise.all([
      db.getPanels(),
      db.getCompanies(),
      db.getBusinessUnits(),
    ]);

    const validBusinessUnitToolIds = new Set(
      businessUnits.flatMap((bu) => (bu.tools || []).map((t) => t.id))
    );
    const validBusinessUnitSlugs = new Set(
      businessUnits.map((bu) => bu.slug.toLowerCase())
    );
    const validCompanySlugs = new Set(
      companies.map((c) => c.slug.toLowerCase())
    );

    const cleanPanels = panels.filter((panel) => {
      if (panel.businessUnitToolId && !validBusinessUnitToolIds.has(panel.businessUnitToolId)) {
        return false;
      }
      if (panel.companySlug) {
        const slugLower = panel.companySlug.toLowerCase();
        if (slugLower.startsWith("comp-") && !validBusinessUnitSlugs.has(slugLower)) {
          return false;
        }
        if (!validCompanySlugs.has(slugLower) && !validBusinessUnitSlugs.has(slugLower)) {
          return false;
        }
      }
      return true;
    });

    // Return ALL panels with locked flag based on user's hierarchy
    // Mask sensitive data (url, description) for locked panels
    const responsePanels = cleanPanels.map(p => {
      const locked = userLevel > p.minHierarchy;
      return {
        id: p.id,
        name: p.name,
        icon: p.icon,
        category: p.category,
        minRole: p.minRole,
        minHierarchy: p.minHierarchy,
        companySlug: p.companySlug,
        isActive: p.isActive,
        businessUnitToolId: (p as unknown as Record<string, unknown>).businessUnitToolId ?? null,
        locked,
        url: locked ? null : p.url,
        description: locked ? null : p.description,
      };
    });

    return NextResponse.json(responsePanels);
  } catch (error) {
    console.error("[GET /api/panels] Erro:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    if (!await hasPermission(user.role || "VIEWER", "panel:create")) {
      return NextResponse.json(
        { error: "Acesso negado. Permissao insuficiente." },
        { status: 403 }
      );
    }

    const validation = await validateRequest(request, createPanelSchema);
    if (!validation.success) {
      return validation.error;
    }

    const payload = {
      ...validation.data,
      category: validation.data.category || "GERAL",
      companySlug: validation.data.companySlug || null,
    };
    const createdPanel = await db.createPanel(payload);

    try {
      const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
      const userAgent = request.headers.get("user-agent") || "Browser";
      await db.addLog(
        user.id,
        "CRIAR_FERRAMENTA",
        `Criou a ferramenta '${validation.data.name}' vinculada a empresa (slug: ${validation.data.companySlug || "Nenhum"}).`,
        ip,
        userAgent
      );
    } catch (logError) {
      console.error("[POST /api/panels] Erro ao gravar log de auditoria:", logError);
    }

    return NextResponse.json(createdPanel, { status: 201 });
  } catch (error) {
    console.error("[POST /api/panels] Erro:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    if (!await hasPermission(user.role || "VIEWER", "panel:create")) {
      return NextResponse.json(
        { error: "Acesso negado. Permissao insuficiente." },
        { status: 403 }
      );
    }

    const validation = await validateRequest(request, updatePanelSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { id, ...updates } = validation.data;
    const updatedPanel = await db.updatePanel(id, updates);

    if (!updatedPanel) {
      return NextResponse.json({ error: "Ferramenta nao encontrada" }, { status: 404 });
    }

    try {
      const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
      const userAgent = request.headers.get("user-agent") || "Browser";
      await db.addLog(
        user.id,
        "ATUALIZAR_FERRAMENTA",
        `Atualizou a ferramenta '${updatedPanel.name}' vinculada a empresa (slug: ${updates.companySlug || "Nenhum"}).`,
        ip,
        userAgent
      );
    } catch (logError) {
      console.error("[PUT /api/panels] Erro ao gravar log de auditoria:", logError);
    }

    return NextResponse.json(updatedPanel);
  } catch (error) {
    console.error("[PUT /api/panels] Erro:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    if (!await hasPermission(user.role || "VIEWER", "panel:create")) {
      return NextResponse.json(
        { error: "Acesso negado. Permissao insuficiente." },
        { status: 403 }
      );
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID e obrigatorio" }, { status: 400 });
    }

    const success = await db.deletePanel(id);
    if (!success) {
      return NextResponse.json({ error: "Ferramenta nao encontrada" }, { status: 404 });
    }

    try {
      const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
      const userAgent = request.headers.get("user-agent") || "Browser";
      await db.addLog(
        user.id,
        "DELETAR_FERRAMENTA",
        `Excluiu a ferramenta com ID: ${id}`,
        ip,
        userAgent
      );
    } catch (logError) {
      console.error("[DELETE /api/panels] Erro ao gravar log de auditoria:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/panels] Erro:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
