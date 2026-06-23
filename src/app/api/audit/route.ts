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

    const logs = await dbSim.getLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Erro ao carregar logs de auditoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
