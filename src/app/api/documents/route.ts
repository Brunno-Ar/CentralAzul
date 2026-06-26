import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbSim } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const docs = await dbSim.getDocuments();
    return NextResponse.json(docs);
  } catch (error) {
    console.error("Erro ao listar documentos:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
