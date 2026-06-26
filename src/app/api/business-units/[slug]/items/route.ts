import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim } from "@/lib/db";
import { SessionUser } from "@/types/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
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
    const { type, data } = body;

    const businessUnit = await dbSim.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });
    }

    let result = null;
    const dbSimAny = dbSim as any;

    if (type === "tool") {
      result = await dbSimAny.addBusinessUnitTool(businessUnit.id, data);
    } else if (type === "social") {
      result = await dbSimAny.addBusinessUnitSocialLink(businessUnit.id, data);
    } else if (type === "analytics") {
      result = await dbSimAny.addBusinessUnitAnalytics(businessUnit.id, data);
    } else if (type === "revenue") {
      result = await dbSimAny.addBusinessUnitRevenue(businessUnit.id, data);
    } else {
      return NextResponse.json({ error: "Tipo de item inválido" }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: "Erro ao adicionar item" }, { status: 500 });
    }

    await dbSim.addLog(
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

    const businessUnit = await dbSim.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });
    }

    let deleted = false;
    const dbSimAny = dbSim as any;

    if (type === "tool") {
      deleted = await dbSimAny.deleteBusinessUnitTool(id);
    } else if (type === "social") {
      deleted = await dbSimAny.deleteBusinessUnitSocialLink(id);
    } else if (type === "analytics") {
      deleted = await dbSimAny.deleteBusinessUnitAnalytics(id);
    } else if (type === "revenue") {
      deleted = await dbSimAny.deleteBusinessUnitRevenue(id);
    } else {
      return NextResponse.json({ error: "Tipo de item inválido" }, { status: 400 });
    }

    if (!deleted) {
      return NextResponse.json({ error: "Erro ao remover item ou item não encontrado" }, { status: 500 });
    }

    await dbSim.addLog(
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
