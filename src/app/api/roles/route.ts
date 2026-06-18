import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Any authenticated user can list the roles to see descriptions or for selectors
    const roles = await dbSim.getRoles();
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Erro ao listar cargos:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const userLevel = (session.user as any).hierarchyLevel || 3;
    const userRole = (session.user as any).role || "VIEWER";

    // Only Level 1 accounts can configure roles
    if (userLevel !== 1 && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    const body = await request.json();
    const { name, displayName, hierarchyLevel } = body;

    if (!name || !displayName || typeof hierarchyLevel !== "number") {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    const newRole = await dbSim.addRole({ name, displayName, hierarchyLevel });

    // Log the security event
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await dbSim.addLog(
      (session.user as any).id,
      "CONFIGURAR_CARGO",
      `Criou o cargo '${name}' (${displayName}) com Nivel ${hierarchyLevel}.`,
      ip,
      userAgent
    );

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const userLevel = (session.user as any).hierarchyLevel || 3;
    const userRole = (session.user as any).role || "VIEWER";

    // Only Level 1 accounts can configure roles
    if (userLevel !== 1 && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, displayName, hierarchyLevel } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do cargo e obrigatorio" }, { status: 400 });
    }

    const updatedRole = await dbSim.updateRole(id, { name, displayName, hierarchyLevel });

    // Log the security event
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await dbSim.addLog(
      (session.user as any).id,
      "CONFIGURAR_CARGO",
      `Atualizou o cargo ID '${id}' para Nome: ${name || "sem alteracao"}, Display: ${displayName || "sem alteracao"}, Nivel: ${hierarchyLevel !== undefined ? hierarchyLevel : "sem alteracao"}.`,
      ip,
      userAgent
    );

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error("Erro ao atualizar cargo:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const userLevel = (session.user as any).hierarchyLevel || 3;
    const userRole = (session.user as any).role || "VIEWER";

    // Only Level 1 accounts can configure roles
    if (userLevel !== 1 && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Apenas Nivel 1." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do cargo e obrigatorio" }, { status: 400 });
    }

    // Safety: prevent deleting default roles like ADMIN or VIEWER if you want,
    // or allow complete editing/deletion as requested. The user said: "criar, apagar, mudar nivel, mudar nome dos niveis e editar por completo".
    const success = await dbSim.deleteRole(id);

    if (!success) {
      return NextResponse.json({ error: "Cargo nao encontrado" }, { status: 404 });
    }

    // Log the security event
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";
    await dbSim.addLog(
      (session.user as any).id,
      "CONFIGURAR_CARGO",
      `Apagou o cargo ID '${id}'.`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao apagar cargo:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
