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

    // 1. Busca todas as unidades cadastradas no banco de dados
    const units = await db.getBusinessUnits().catch(() => []);
    
    // 2. Obter base de dados inicial (mock consistente como fallback)
    const mockData = generateDashboardMockData(filters);

    // 3. Agregar dados REAIS do banco se o usuário tiver preenchido faturamento, redes ou acessos
    let totalRevenueReal = 0;
    let latestRevenueAmount = 0;
    let previousRevenueAmount = 0;
    
    let totalFollowersReal = 0;
    let hasFollowers = false;

    let totalPageViewsReal = 0;
    let totalSessionsReal = 0;
    let hasAnalytics = false;

    units.forEach((u) => {
      // RLS/Filtro por unidade selecionada
      if (unit !== "all" && u.slug !== unit) return;

      // Agrega Faturamento Real
      if (u.revenueData && u.revenueData.length > 0) {
        const sortedRev = [...u.revenueData].sort((a, b) => b.period.localeCompare(a.period));
        totalRevenueReal += sortedRev.reduce((sum, r) => sum + r.amount, 0);
        latestRevenueAmount += sortedRev[0].amount;
        if (sortedRev.length > 1) {
          previousRevenueAmount += sortedRev[1].amount;
        }
      }

      // Agrega Seguidores Reais
      if (u.socialLinks && u.socialLinks.length > 0) {
        u.socialLinks.forEach((s) => {
          if (!s.isActive) return;
          if (platform !== "all" && s.platform.toLowerCase() !== platform.toLowerCase()) return;
          totalFollowersReal += s.followersCount;
          hasFollowers = true;
        });
      }

      // Agrega Analytics Acessos
      if (u.analytics && u.analytics.length > 0) {
        u.analytics.forEach((a) => {
          if (platform !== "all" && platform !== "site" && a.source.toLowerCase() !== platform.toLowerCase()) return;
          totalPageViewsReal += a.pageViews;
          totalSessionsReal += a.sessions;
          hasAnalytics = true;
        });
      }
    });

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);

    const formatNumber = (val: number) => {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
      if (val >= 1000) return (val / 1000).toFixed(1) + "K";
      return val.toLocaleString("pt-BR");
    };

    // Sobrescreve KPIs com dados reais agregados do banco de dados
    if (totalRevenueReal > 0) {
      mockData.kpis.receitaTotal.raw = totalRevenueReal;
      mockData.kpis.receitaTotal.value = formatCurrency(totalRevenueReal);
      if (previousRevenueAmount > 0) {
        const change = ((latestRevenueAmount - previousRevenueAmount) / previousRevenueAmount) * 100;
        mockData.kpis.receitaTotal.change = change;
        mockData.kpis.receitaTotal.previousRaw = previousRevenueAmount;
        mockData.kpis.receitaTotal.previousValue = formatCurrency(previousRevenueAmount);
      }
    }

    if (latestRevenueAmount > 0) {
      mockData.kpis.receitaMensal.raw = latestRevenueAmount;
      mockData.kpis.receitaMensal.value = formatCurrency(latestRevenueAmount);
    }

    if (hasFollowers && totalFollowersReal > 0) {
      mockData.kpis.seguidoresTotais.raw = totalFollowersReal;
      mockData.kpis.seguidoresTotais.value = formatNumber(totalFollowersReal);
    }

    if (hasAnalytics && totalPageViewsReal > 0) {
      mockData.kpis.visualizacoes.raw = totalPageViewsReal;
      mockData.kpis.visualizacoes.value = formatNumber(totalPageViewsReal);
    }

    if (hasAnalytics && totalSessionsReal > 0) {
      mockData.kpis.alcance.raw = totalSessionsReal;
      mockData.kpis.alcance.value = formatNumber(totalSessionsReal);
    }

    // Ajusta a lista de unidades no resultado com base no banco de dados real
    if (units.length > 0) {
      const activeUnits = units.filter(u => u.isActive);
      
      if (unit === "all") {
        const mappedUnitMetrics = activeUnits.map(u => {
          // Calcula faturamento e seguidores reais dessa unidade
          const unitRev = u.revenueData && u.revenueData.length > 0 
            ? u.revenueData.reduce((sum, r) => sum + r.amount, 0)
            : undefined;
            
          const unitFollowers = u.socialLinks && u.socialLinks.length > 0
            ? u.socialLinks.filter(s => s.isActive).reduce((sum, s) => sum + s.followersCount, 0)
            : undefined;

          const existingMock = mockData.unitMetrics.find(m => m.slug === u.slug);
          return {
            slug: u.slug,
            name: u.name,
            receita: unitRev ?? existingMock?.receita ?? Math.floor(Math.random() * 150000) + 30000,
            seguidores: unitFollowers ?? existingMock?.seguidores ?? Math.floor(Math.random() * 15000) + 4000,
            crescimento: existingMock?.crescimento ?? Math.random() * 15 + 1,
            engagement: existingMock?.engagement ?? Math.random() * 5 + 2,
          };
        });
        mockData.unitMetrics = mappedUnitMetrics;
      } else {
        const targetUnit = activeUnits.find(u => u.slug === unit);
        if (targetUnit) {
          const unitRev = targetUnit.revenueData && targetUnit.revenueData.length > 0 
            ? targetUnit.revenueData.reduce((sum, r) => sum + r.amount, 0)
            : undefined;
            
          const unitFollowers = targetUnit.socialLinks && targetUnit.socialLinks.length > 0
            ? targetUnit.socialLinks.filter(s => s.isActive).reduce((sum, s) => sum + s.followersCount, 0)
            : undefined;

          const existingMock = mockData.unitMetrics.find(m => m.slug === targetUnit.slug);
          mockData.unitMetrics = [{
            slug: targetUnit.slug,
            name: targetUnit.name,
            receita: unitRev ?? existingMock?.receita ?? Math.floor(Math.random() * 150000) + 30000,
            seguidores: unitFollowers ?? existingMock?.seguidores ?? Math.floor(Math.random() * 15000) + 4000,
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
