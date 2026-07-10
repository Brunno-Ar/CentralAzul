import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { generateDashboardMockData, PeriodFilter, PlatformFilter, UnitFilter } from "@/lib/mock/dashboard-metrics";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period");
    const unitParam = searchParams.get("unit");
    const platformParam = searchParams.get("platform");
    const customStartDate = searchParams.get("customStartDate") || undefined;
    const customEndDate = searchParams.get("customEndDate") || undefined;

    let period: PeriodFilter = 30;
    if (periodParam) {
      if (periodParam === "custom") {
        period = "custom";
      } else {
        const parsedPeriod = parseInt(periodParam, 10);
        if ([7, 30, 90, 365].includes(parsedPeriod)) {
          period = parsedPeriod as PeriodFilter;
        }
      }
    }

    const unit: UnitFilter = unitParam || "all";
    const platform: PlatformFilter = (platformParam as PlatformFilter) || "all";

    const filters = {
      period,
      unit,
      platform,
      customStartDate,
      customEndDate,
    };

    // Aqui, em produção com dados de analytics indexados no DB,
    // consultaríamos as tabelas correspondentes (BusinessUnitAnalytics, BusinessUnitRevenue, etc.).
    // Caso contrário, usamos o gerador determinístico a partir dos filtros fornecidos.
    
    // Vamos verificar se existem dados reais de receita ou analytics no banco para as unidades selecionadas
    // para tentar retornar dados dinâmicos reais quando disponíveis.
    const units = await db.getBusinessUnits().catch(() => []);
    
    // Obter dados dinâmicos do mock determinístico
    const mockData = generateDashboardMockData(filters);

    // Ajusta a lista de unidades no resultado com base no banco de dados real
    if (units.length > 0) {
      const activeUnits = units.filter(u => u.isActive);
      
      // Se o filtro for 'all', podemos atualizar os slugs/nomes das unidades dinamicamente
      if (unit === "all") {
        const mappedUnitMetrics = activeUnits.map(u => {
          // Tenta reaproveitar ou gerar dinamicamente os valores para cada unidade real do DB
          const existingMock = mockData.unitMetrics.find(m => m.slug === u.slug);
          return {
            slug: u.slug,
            name: u.name,
            receita: existingMock?.receita ?? Math.floor(Math.random() * 150000) + 30000,
            seguidores: existingMock?.seguidores ?? Math.floor(Math.random() * 15000) + 4000,
            crescimento: existingMock?.crescimento ?? Math.random() * 15 + 1,
            engagement: existingMock?.engagement ?? Math.random() * 5 + 2,
          };
        });
        mockData.unitMetrics = mappedUnitMetrics;
      } else {
        const targetUnit = activeUnits.find(u => u.slug === unit);
        if (targetUnit) {
          const existingMock = mockData.unitMetrics.find(m => m.slug === targetUnit.slug);
          mockData.unitMetrics = [{
            slug: targetUnit.slug,
            name: targetUnit.name,
            receita: existingMock?.receita ?? Math.floor(Math.random() * 150000) + 30000,
            seguidores: existingMock?.seguidores ?? Math.floor(Math.random() * 15000) + 4000,
            crescimento: existingMock?.crescimento ?? Math.random() * 15 + 1,
            engagement: existingMock?.engagement ?? Math.random() * 5 + 2,
          }];
        }
      }
    }

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Erro ao buscar métricas de analytics:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar métricas" },
      { status: 500 },
    );
  }
}
