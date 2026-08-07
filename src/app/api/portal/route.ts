import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  fetchPortalContas,
  fetchPortalReport,
  fetchPortalOrganico,
  fetchPortalAdPreview,
  PortalReportData,
  PortalConta,
} from "@/lib/portal-api";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "contas";
    const conta = searchParams.get("conta");
    const period = searchParams.get("period") || "mes";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const adId = searchParams.get("ad_id") || undefined;

    if (action === "contas") {
      const contas = await fetchPortalContas();
      return NextResponse.json({ contas });
    }

    if (action === "report") {
      if (!conta) {
        return NextResponse.json({ error: "Parametro 'conta' eh obrigatorio" }, { status: 400 });
      }
      const report = await fetchPortalReport(conta, period, from, to);
      return NextResponse.json(report);
    }

    if (action === "organico") {
      if (!conta) {
        return NextResponse.json({ error: "Parametro 'conta' eh obrigatorio" }, { status: 400 });
      }
      const organico = await fetchPortalOrganico(conta, period, from, to);
      return NextResponse.json(organico);
    }

    if (action === "preview") {
      if (!conta || !adId) {
        return NextResponse.json({ error: "Parametros 'conta' e 'ad_id' sao obrigatorios" }, { status: 400 });
      }
      const preview = await fetchPortalAdPreview(conta, adId);
      return NextResponse.json(preview);
    }

    if (action === "all") {
      const contas = await fetchPortalContas();
      const reports: Record<string, PortalReportData> = {};

      await Promise.all(
        contas.map(async (c: PortalConta) => {
          try {
            const rep = await fetchPortalReport(c.id, period, from, to);
            reports[c.id] = rep;
          } catch (e) {
            console.error(`Erro ao carregar relatorio para conta ${c.id}:`, e);
          }
        })
      );

      return NextResponse.json({ contas, reports });
    }

    return NextResponse.json({ error: "Acao invalida" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro na API do portal de traqueamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao conectar com o portal de tráfego" },
      { status: 500 }
    );
  }
}
