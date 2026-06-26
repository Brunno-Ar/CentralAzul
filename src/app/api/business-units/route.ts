import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim } from "@/lib/db";
import { SessionUser } from "@/types/auth";

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

    // Filter by user's company if not admin
    const userLevel = user.hierarchyLevel || 3;
    const userCompany = user.company;

    const filtered =
      userLevel <= 1
        ? businessUnits
        : businessUnits.filter(
            (bu: { company: string }) =>
              bu.company === userCompany || bu.company === "CENTRAL",
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
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      company,
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
        { status: 400 },
      );
    }

    if (!dbSim.addBusinessUnit) {
      return NextResponse.json(
        { error: "Função não implementada" },
        { status: 500 },
      );
    }

    const newBusinessUnit = await dbSim.addBusinessUnit({
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
    });

    // Log de auditoria
    await dbSim.addLog(
      user.id,
      "CRIAR_UNIDADE_NEGOCIO",
      `Criou unidade de negócio: ${name} (${company})`,
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
