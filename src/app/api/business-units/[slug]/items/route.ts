import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateRequest, createBusinessUnitItemSchema, createBusinessUnitToolSchema, createBusinessUnitSocialLinkSchema, createBusinessUnitAnalyticsSchema, createBusinessUnitRevenueSchema, updateBusinessUnitToolSchema, updateBusinessUnitSocialLinkSchema } from "@/lib/validation";
import { syncToolToPanel, syncToolUpdateToPanel, syncToolDeleteFromPanel } from "@/lib/tool-sync";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;



  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;
    if (userLevel > 2) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { slug } = await params;
    const validation = await validateRequest(request, createBusinessUnitItemSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { type, data: rawData } = validation.data;

    const businessUnit = await db.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });
    }

    let validatedData: Record<string, unknown> = {};
    if (type === "tool") {
      const sub = createBusinessUnitToolSchema.pick({ name: true, description: true, url: true, icon: true, category: true }).safeParse(rawData);
      if (!sub.success) {
        return NextResponse.json({ error: "Dados invalidos", details: sub.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
      }
      validatedData = sub.data as unknown as Record<string, unknown>;
    } else if (type === "social") {
      const sub = createBusinessUnitSocialLinkSchema.pick({ platform: true, handle: true, url: true, followersCount: true }).safeParse(rawData);
      if (!sub.success) {
        return NextResponse.json({ error: "Dados invalidos", details: sub.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
      }
      validatedData = sub.data as unknown as Record<string, unknown>;
    } else if (type === "analytics") {
      const sub = createBusinessUnitAnalyticsSchema.pick({ date: true, pageViews: true, uniqueVisitors: true, avgSessionDuration: true, bounceRate: true }).safeParse(rawData);
      if (!sub.success) {
        return NextResponse.json({ error: "Dados invalidos", details: sub.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
      }
      validatedData = sub.data as unknown as Record<string, unknown>;
    } else if (type === "revenue") {
      const sub = createBusinessUnitRevenueSchema.pick({ month: true, amount: true, currency: true }).safeParse(rawData);
      if (!sub.success) {
        return NextResponse.json({ error: "Dados invalidos", details: sub.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
      }
      validatedData = sub.data as unknown as Record<string, unknown>;
    }

    let result = null;

    if (type === "tool") {
      result = await db.addBusinessUnitTool(businessUnit.id, validatedData as unknown as Parameters<typeof db.addBusinessUnitTool>[1]);
    } else if (type === "social") {
      result = await db.addBusinessUnitSocialLink(businessUnit.id, validatedData as unknown as Parameters<typeof db.addBusinessUnitSocialLink>[1]);
    } else if (type === "analytics") {
      result = await db.addBusinessUnitAnalytics(businessUnit.id, validatedData as unknown as Parameters<typeof db.addBusinessUnitAnalytics>[1]);
    } else if (type === "revenue") {
      result = await db.addBusinessUnitRevenue(businessUnit.id, validatedData as unknown as Parameters<typeof db.addBusinessUnitRevenue>[1]);
    }

    if (!result) {
      return NextResponse.json({ error: "Erro ao adicionar item" }, { status: 500 });
    }

    // Sincroniza a ferramenta recem-criada na aba global Ferramentas (SystemPanel)
    if (type === "tool" && result) {
      try {
        await syncToolToPanel(
          {
            id: (result as Record<string, unknown>).id as string,
            name: (result as Record<string, unknown>).name as string,
            url: (result as Record<string, unknown>).url as string,
            icon: ((result as Record<string, unknown>).icon as string) || null,
            description:
              ((result as Record<string, unknown>).description as string) || null,
            category:
              ((result as Record<string, unknown>).category as string) ||
              businessUnit.company,
            isActive:
              ((result as Record<string, unknown>).isActive as boolean) ??
              true,
          },
          {
            id: businessUnit.id,
            slug: businessUnit.slug,
            company: businessUnit.company,
          },
        );
      } catch (syncError) {
        console.error("[items POST] Erro ao sincronizar ferramenta:", syncError);
      }
    }

    await db.addLog(
      user.id,
      "ADICIONAR_SUB_ITEM",
      `Adicionou item ${type} na unidade: ${businessUnit.name}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser",
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao adicionar item na unidade:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;



  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;
    if (userLevel > 2) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Parâmetros type e id são obrigatórios" }, { status: 400 });
    }

    const businessUnit = await db.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });
    }

    const itemOwnerId = await db.getBusinessUnitItemOwner(
      id,
      type as "tool" | "social" | "analytics" | "revenue",
    );
    if (!itemOwnerId) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }
    if (itemOwnerId !== businessUnit.id) {
      return NextResponse.json(
        { error: "Item não pertence a esta unidade" },
        { status: 403 },
      );
    }

    let deleted = false;

    if (type === "tool") {
      deleted = await db.deleteBusinessUnitTool(id);
    } else if (type === "social") {
      deleted = await db.deleteBusinessUnitSocialLink(id);
    } else if (type === "analytics") {
      deleted = await db.deleteBusinessUnitAnalytics(id);
    } else if (type === "revenue") {
      deleted = await db.deleteBusinessUnitRevenue(id);
    } else {
      return NextResponse.json({ error: "Tipo de item inválido" }, { status: 400 });
    }

    if (!deleted) {
      return NextResponse.json({ error: "Erro ao remover item ou item não encontrado" }, { status: 500 });
    }

    // Propaga a exclusao para a aba global Ferramentas (SystemPanel)
    if (type === "tool") {
      try {
        await syncToolDeleteFromPanel(id);
      } catch (syncError) {
        console.error("[items DELETE] Erro ao sincronizar exclusao:", syncError);
      }
    }

    await db.addLog(
      user.id,
      "REMOVER_SUB_ITEM",
      `Removeu item ${type} (ID: ${id}) na unidade: ${businessUnit.name}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser",
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover item na unidade:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;



  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const userLevel = user.hierarchyLevel || 3;
    if (userLevel > 2) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { type, id, data: rawData } = body;

    if (!type || !id || !rawData) {
      return NextResponse.json({ error: "Parâmetros type, id e data são obrigatórios" }, { status: 400 });
    }

    const businessUnit = await db.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });
    }

    const itemOwnerId = await db.getBusinessUnitItemOwner(
      id,
      type as "tool" | "social" | "analytics" | "revenue",
    );
    if (!itemOwnerId || itemOwnerId !== businessUnit.id) {
      return NextResponse.json(
        { error: "Item não encontrado ou não pertence a esta unidade" },
        { status: 403 },
      );
    }

    let result = null;
    let toolUpdateData: Record<string, unknown> | null = null;

    if (type === "tool") {
      const sub = updateBusinessUnitToolSchema.omit({ id: true }).safeParse(rawData);
      if (!sub.success) {
        return NextResponse.json(
          {
            error: "Dados invalidos",
            details: sub.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
          },
          { status: 400 },
        );
      }
      toolUpdateData = sub.data as Record<string, unknown>;
      result = await db.updateBusinessUnitTool(id, sub.data);
    } else if (type === "social") {
      const sub = updateBusinessUnitSocialLinkSchema.omit({ id: true }).safeParse(rawData);
      if (!sub.success) {
        return NextResponse.json(
          {
            error: "Dados invalidos",
            details: sub.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
          },
          { status: 400 },
        );
      }
      result = await db.updateBusinessUnitSocialLink(id, sub.data);
    } else {
      return NextResponse.json({ error: "Tipo de item inválido para edição" }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: "Erro ao editar item" }, { status: 500 });
    }

    // Propaga a edicao para a aba global Ferramentas (SystemPanel)
    if (type === "tool" && result && toolUpdateData) {
      try {
        await syncToolUpdateToPanel(
          id,
          toolUpdateData as Parameters<typeof syncToolUpdateToPanel>[1],
          {
            id: businessUnit.id,
            slug: businessUnit.slug,
            company: businessUnit.company,
          },
        );
      } catch (syncError) {
        console.error("[items PUT] Erro ao sincronizar edicao:", syncError);
      }
    }

    await db.addLog(
      user.id,
      "EDITAR_SUB_ITEM",
      `Editou item ${type} (ID: ${id}) na unidade: ${businessUnit.name}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser",
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao editar item na unidade:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
