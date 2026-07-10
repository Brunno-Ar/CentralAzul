import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limiterResponse = await rateLimit(request, "api");
  if (limiterResponse) return limiterResponse;

  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca todas as empresas e unidades do banco de dados para agregar dinamicamente
    const [companies, businessUnits] = await Promise.all([
      db.getCompanies().catch(() => []),
      db.getBusinessUnits().catch(() => []),
    ]);

    const activeCompanies = companies.filter((c) => c.isActive);

    const metrics = activeCompanies.map((comp) => {
      const companyUnits = businessUnits.filter((bu) => bu.company === comp.slug);
      const activeUnitsCount = companyUnits.filter((bu) => bu.isActive).length;

      // Estado inicial padrão para a métrica da empresa
      const metric = {
        company: comp.slug,
        isActive: comp.isActive,
        label: `${activeUnitsCount} ${activeUnitsCount === 1 ? "Unidade Ativa" : "Unidades Ativas"}`,
        value: activeUnitsCount > 0 ? 80 : 0,
        period: String(new Date().getFullYear()),
      };

      // 1. Tentar agregar dados de faturamento (revenueData) das unidades
      let totalRevenue = 0;
      let hasRevenue = false;
      companyUnits.forEach((bu) => {
        if (bu.revenueData && bu.revenueData.length > 0) {
          // Soma o faturamento mais recente de cada unidade
          totalRevenue += bu.revenueData[0].amount;
          hasRevenue = true;
        }
      });

      if (hasRevenue && totalRevenue > 0) {
        metric.label = `Faturamento: R$ ${totalRevenue.toLocaleString("pt-BR")}`;
        metric.value = 90; // Proporcional/Progresso indicativo
        return metric;
      }

      // 2. Tentar agregar seguidores das redes sociais (socialLinks)
      let totalFollowers = 0;
      let hasFollowers = false;
      companyUnits.forEach((bu) => {
        if (bu.socialLinks && bu.socialLinks.length > 0) {
          const instagramLink = bu.socialLinks.find(
            (s) => s.platform.toLowerCase() === "instagram" && s.isActive
          );
          if (instagramLink) {
            totalFollowers += instagramLink.followersCount;
            hasFollowers = true;
          }
        }
      });

      if (hasFollowers && totalFollowers > 0) {
        metric.label = `${totalFollowers.toLocaleString("pt-BR")} Inscritos/Seguidores`;
        metric.value = 85;
        return metric;
      }

      // 3. Fallback personalizado para o Gran Reserva ou outras marcas
      if (comp.slug === "COMP-GRAN-RESERVA") {
        metric.label = "88% dos Lotes Vendidos";
        metric.value = 88;
      }

      return metric;
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Erro na rota api/company-metrics:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
