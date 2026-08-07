import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SessionUser } from "@/types/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // Credential check: if no external sync API is configured, return 501
  // so the UI can show "Funcao em desenvolvimento" instead of crashing.
  if (!process.env.SYNC_API_URL && process.env.EXTERNAL_SYNC_ENABLED !== "true") {
    console.warn("SUBFLOW_UNAVAILABLE: SYNC_API_URL not configured");
    return NextResponse.json(
      { error: "Funcao em desenvolvimento", softError: true },
      { status: 501 },
    );
  }

  const limiterResponse = await rateLimit(request, "mutation");
  if (limiterResponse) return limiterResponse;

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "CSRF token invalido" }, { status: 403 });
  }

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const { slug } = await params;

    // Check if the business unit exists
    const businessUnit = await db.getBusinessUnitBySlug(slug);
    if (!businessUnit) {
      return NextResponse.json(
        { error: "Unidade não encontrada" },
        { status: 404 },
      );
    }

    // Access control: only allow admins or coordinators (Level 1 or 2)
    const userLevel = user.hierarchyLevel || 3;

    if (userLevel > 2) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const success = await db.syncBusinessUnitData(slug);

    if (!success) {
      return NextResponse.json(
        { error: "Erro ao sincronizar métricas" },
        { status: 500 },
      );
    }

    // Log de auditoria
    await db.addLog(
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
