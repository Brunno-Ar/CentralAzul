import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const businessUnits = await db.getBusinessUnits();

    const borgoUnit = businessUnits.find(bu => bu.company === "BORGO");
    const mapleUnit = businessUnits.find(bu => bu.company === "MAPLE_BEAR");
    const azulUnits = businessUnits.filter(bu => bu.company === "AZUL");

    const borgoMetric = {
      company: "BORGO",
      isActive: true,
      label: "88% dos Lotes Vendidos",
      value: 88,
      period: "2026",
    };

    const mapleMetric = {
      company: "MAPLE_BEAR",
      isActive: true,
      label: "420 Alunos Matriculados",
      value: 92,
      period: "2026",
    };

    const activeAzulObras = azulUnits.filter(bu => bu.isActive).length;
    const azulMetric = {
      company: "AZUL",
      isActive: true,
      label: `${activeAzulObras} Empreendimentos Ativos`,
      value: 74,
      period: "2026",
    };

    if (borgoUnit && borgoUnit.revenueData && borgoUnit.revenueData.length > 0) {
      const latestRev = borgoUnit.revenueData[0];
      borgoMetric.label = `Faturamento: R$ ${latestRev.amount.toLocaleString("pt-BR")}`;
    }
    
    if (mapleUnit && mapleUnit.socialLinks && mapleUnit.socialLinks.length > 0) {
      const insta = mapleUnit.socialLinks.find(s => s.platform.toLowerCase() === "instagram");
      if (insta) {
        mapleMetric.label = `${insta.followersCount.toLocaleString("pt-BR")} Inscritos/Seguidores`;
      }
    }

    return NextResponse.json([borgoMetric, mapleMetric, azulMetric]);
  } catch (error) {
    console.error("Erro na rota api/company-metrics:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
