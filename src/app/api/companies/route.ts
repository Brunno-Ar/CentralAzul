import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { 
  validateRequest, 
  validateParams, 
  validateSearchParams,
  paginationSchema,
  createCompanySchema,
  updateCompanySchema,
  deleteCompanySchema
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

    const companies = await db.getCompanies();
    return NextResponse.json(companies);
  } catch (error) {
    console.error("[GET /api/companies] Erro:", error);
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
    if (user.hierarchyLevel !== 1 && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    const validation = await validateRequest(request, createCompanySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { name, slug, color, isActive, showOnHome, order } = validation.data;

    // Slug generation fallback
    const finalSlug = slug || "comp-" + name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    // Automatic display order calculation
    let finalOrder = order || 0;
    if (finalOrder === 0) {
      const allCompanies = await db.getCompanies();
      const maxOrder = allCompanies.reduce((max, c) => c.order > max ? c.order : max, 0);
      finalOrder = maxOrder + 1;
    }

    const newCompany = await db.createCompany({
      name,
      slug: finalSlug,
      color: color || "AZUL",
      isActive: isActive !== undefined ? isActive : true,
      showOnHome: showOnHome !== undefined ? showOnHome : true,
      order: finalOrder,
    });

    // Write security log (non-blocking)
    try {
      const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
      const userAgent = request.headers.get("user-agent") || "Browser";
      await db.addLog(
        user.id,
        "CONFIGURAR_EMPRESA",
        `Criou a empresa '${name}' (slug: ${finalSlug}) com cor ${color || "AZUL"}.`,
        ip,
        userAgent
      );
    } catch (logError) {
      console.error("[POST /api/companies] Erro ao gravar log de auditoria:", logError);
    }

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error("[POST /api/companies] Erro:", error);
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
    if (user.hierarchyLevel !== 1 && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    const validation = await validateRequest(request, updateCompanySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { id, ...updates } = validation.data;
    const updatedCompany = await db.updateCompany(id, updates);

    if (!updatedCompany) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    // Write security log (non-blocking)
    try {
      const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
      const userAgent = request.headers.get("user-agent") || "Browser";
      await db.addLog(
        user.id,
        "CONFIGURAR_EMPRESA",
        `Atualizou a empresa ID '${id}' (Nome: ${updates.name || "sem alteracao"}).`,
        ip,
        userAgent
      );
    } catch (logError) {
      console.error("[PUT /api/companies] Erro ao gravar log de auditoria:", logError);
    }

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("[PUT /api/companies] Erro:", error);
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
    if (user.hierarchyLevel !== 1 && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    const paramsValidation = validateParams(
      Object.fromEntries(request.nextUrl.searchParams),
      deleteCompanySchema
    );
    if (!paramsValidation.success) {
      return paramsValidation.error;
    }

    const { id } = paramsValidation.data;
    const success = await db.deleteCompany(id);

    if (!success) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    // Write security log (non-blocking)
    try {
      const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
      const userAgent = request.headers.get("user-agent") || "Browser";
      await db.addLog(
        user.id,
        "CONFIGURAR_EMPRESA",
        `Apagou a empresa ID '${id}'.`,
        ip,
        userAgent
      );
    } catch (logError) {
      console.error("[DELETE /api/companies] Erro ao gravar log de auditoria:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/companies] Erro:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
