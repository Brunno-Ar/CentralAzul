import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateSearchParams } from "@/lib/validation";
import { metricsQuerySchema } from "@/lib/validation";
import { computeMetrics } from "@/lib/services/metrics-service";
import type { MetricasFilters, PeriodFilter, PlatformFilter, UnitFilter } from "@/lib/mock/dashboard-metrics";

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Validar query params com Zod
    const validation = validateSearchParams(searchParams, metricsQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { period: periodParam, unit, platform, customStartDate, customEndDate } = validation.data;

    // Converte period string para PeriodFilter
    let period: PeriodFilter;
    if (periodParam === "custom") {
      period = "custom";
    } else {
      period = parseInt(periodParam, 10) as PeriodFilter;
    }

    const filters: MetricasFilters = {
      period,
      unit: unit as UnitFilter,
      platform: platform as PlatformFilter,
      customStartDate,
      customEndDate,
    };

    // Delega toda a agregacao para o servico
    const data = await computeMetrics(filters);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar métricas de analytics:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar métricas" },
      { status: 500 },
    );
  }
}
