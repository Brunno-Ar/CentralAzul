import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
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
    void _user;

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

    return NextResponse.json(businessUnits);
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
    });

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
