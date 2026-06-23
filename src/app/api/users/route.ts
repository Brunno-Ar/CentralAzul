import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const userLevel = (session.user as any).hierarchyLevel ?? 99;
    if (userLevel > 2) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores e gerentes." },
        { status: 403 },
      );
    }

    const users = await dbSim.getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro ao carregar usuarios:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const userLevel = (session.user as any).hierarchyLevel ?? 99;
    if (userLevel > 2) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores e gerentes." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { userId, role, hierarchyLevel, status } = body;

    if (!userId || !role || typeof hierarchyLevel !== "number") {
      return NextResponse.json(
        { error: "Campos obrigatorios ausentes" },
        { status: 400 },
      );
    }

    // Perform update
    const updatedUser = await dbSim.updateUserHierarchy(
      userId,
      role as string,
      hierarchyLevel,
      status,
    );

    // Refresh role in JWT session
    let refreshRes: Response | null = null;
    try {
      refreshRes = await fetch(new URL("/api/auth/refresh-role", request.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ userId }),
      });
    } catch (e) {
      console.error("Erro ao atualizar JWT do usuario:", e);
    }

    // Audit log
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Browser";

    await dbSim.addLog(
      (session.user as any).id,
      "ALTERAR_HIERARQUIA",
      `Alterou permissao do usuario ${updatedUser?.email || userId} para Role: ${role}, Nivel: ${hierarchyLevel}, Status: ${status || "ACTIVE"}.`,
      ip,
      userAgent,
    );

    const response = NextResponse.json(updatedUser);
    if (refreshRes && refreshRes.headers.get("set-cookie")) {
      response.headers.set("set-cookie", refreshRes.headers.get("set-cookie")!);
    }
    return response;
  } catch (error) {
    console.error("Erro ao atualizar usuario:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
