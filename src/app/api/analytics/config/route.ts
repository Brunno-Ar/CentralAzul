import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllProviderStatuses, getProviderRegistry } from "@/lib/analytics/registry";
import { getSyncHistory } from "@/lib/analytics/sync";
import type { ProviderId } from "@/lib/analytics/types";


export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const user = session.user as { hierarchyLevel?: number };
  if (user.hierarchyLevel !== 1) {
    return NextResponse.json(
      { error: "Apenas usuarios de Nivel 1 podem acessar configuracoes de analytics" },
      { status: 403 },
    );
  }

  try {
    const statuses = await getAllProviderStatuses();
    const syncHistory = await getSyncHistory();

    return NextResponse.json({
      providers: statuses,
      syncHistory,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Erro ao buscar configuracoes", details: msg },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const user = session.user as { hierarchyLevel?: number };
  if (user.hierarchyLevel !== 1) {
    return NextResponse.json(
      { error: "Apenas usuarios de Nivel 1 podem configurar analytics" },
      { status: 403 },
    );
  }

  let body: {
    action: "test" | "save_credentials" | "clear_credentials";
    providerId: ProviderId;
    credentials?: Record<string, string>;
  };

  try {
    body = await request.json();
  } catch (e) { console.error(e);
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const registry = getProviderRegistry();
  const provider = registry.get(body.providerId);

  if (!provider) {
    return NextResponse.json(
      { error: `Provider nao encontrado: ${body.providerId}` },
      { status: 404 },
    );
  }

  if (body.action === "test") {
    try {
      const result = await provider.testConnection();
      return NextResponse.json({
        success: result.success,
        message: result.message,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { success: false, message: `Erro: ${msg}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: `Acao nao suportada: ${body.action}` },
    { status: 400 },
  );
}
