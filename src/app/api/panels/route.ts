import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const panels = await dbSim.getPanels();
    return NextResponse.json(panels);
  } catch (error) {
    console.error("Erro ao listar paineis:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
