import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // =========================================================================
    // COMO CONECTAR COM SUAS APIS REAIS:
    // 
    // 1. Defina as URLs e tokens das APIs no seu arquivo .env, por exemplo:
    //    MAPLE_BEAR_API_URL="https://api.maplebear.exemplo.com/v1/stats"
    //    CRM_AZUL_API_URL="https://crm.azulinc.exemplo.com/v1/deals"
    //    BORGO_API_URL="https://api.borgodelvino.exemplo.com/v1/status"
    //    API_SECRET_KEY="seu_token_aqui"
    // 
    // 2. Substitua o retorno simulado abaixo por requisicoes fetch reais:
    //    
    //    const response = await fetch(process.env.MAPLE_BEAR_API_URL, {
    //      headers: { "Authorization": `Bearer ${process.env.API_SECRET_KEY}` }
    //    });
    //    const data = await response.json();
    //    const mapleMatriculas = data.active_students; // ex: 420
    // =========================================================================

    // Dados Simulados (Substitua pelas chamadas de API reais quando disponiveis)
    const metrics = {
      borgo: {
        metric: "88% dos Lotes Vendidos",
        progress: 88,
      },
      maple: {
        metric: "420 Alunos Matriculados",
        progress: 92,
      },
      azul: {
        metric: "3 Obras em Andamento",
        progress: 74,
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Erro ao carregar metricas das empresas:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
