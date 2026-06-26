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
    const { slug } = await params;

    // Check if the business unit exists
    const businessUnit = await dbSim.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json(
        { error: "Unidade não encontrada" },
        { status: 404 },
      );
    }

    const syncFn = (dbSim as any).syncBusinessUnitData;
    if (!syncFn) {
      return NextResponse.json(
        { error: "Função de sincronização não disponível" },
        { status: 500 },
      );
    }

    const success = await syncFn(slug);

    if (!success) {
      return NextResponse.json(
        { error: "Erro ao sincronizar métricas" },
        { status: 500 },
      );
    }

    // Log de auditoria
    await dbSim.addLog(
      user.id,
      "SINCRONIZAR_METRICAS",
      `Sincronizou métricas e redes sociais da unidade: ${businessUnit.name}`,
      request.headers.get("x-forwarded-for") || "127.0.0.1",
      request.headers.get("user-agent") || "Browser",
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao sincronizar métricas da unidade:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
