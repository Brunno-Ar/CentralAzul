import { NextResponse } from "next/server";
import { auth } from "@/auth";

const CONNECTA_API_BASE = "https://api-connecta.vercel.app/api/v1";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const apiKey = process.env.CONNECTA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Configuração da API Connecta ausente" }, { status: 500 });
    }

    const headers = {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    };

    // Buscar dados em paralelo para agilizar
    const [summaryRes, selectionsRes, botsRes] = await Promise.all([
      fetch(`${CONNECTA_API_BASE}/metrics/summary`, { headers, next: { revalidate: 300 } }),
      fetch(`${CONNECTA_API_BASE}/metrics/selections`, { headers, next: { revalidate: 300 } }),
      fetch(`${CONNECTA_API_BASE}/metrics/bots`, { headers, next: { revalidate: 300 } }),
    ]);

    if (!summaryRes.ok || !selectionsRes.ok || !botsRes.ok) {
      throw new Error("Falha ao buscar dados da API Connecta");
    }

    const [summary, selections, bots] = await Promise.all([
      summaryRes.json(),
      selectionsRes.json(),
      botsRes.json(),
    ]);

    return NextResponse.json({
      summary: summary.data,
      selections: selections.data,
      bots: bots.data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao conectar com Connecta";
    console.error("Erro na API Connecta:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
