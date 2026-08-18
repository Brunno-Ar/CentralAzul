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

const PORTAL_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos
const portalMemoryCache = new Map<string, { data: any; timestamp: number }>();

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
    const force = searchParams.get("force") === "true";

    const cacheKey = `${action}:${conta || ""}:${period}:${from || ""}:${to || ""}:${adId || ""}`;

    if (!force && portalMemoryCache.has(cacheKey)) {
      const cached = portalMemoryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < PORTAL_CACHE_TTL_MS) {
        return NextResponse.json(cached.data, {
          headers: { "X-Cache": "HIT" },
        });
      }
    }

    let responseData: any;

    if (action === "contas") {
      const contas = await fetchPortalContas();
      responseData = { contas };
    } else if (action === "report") {
      if (!conta) {
        return NextResponse.json({ error: "Parametro 'conta' eh obrigatorio" }, { status: 400 });
      }
      responseData = await fetchPortalReport(conta, period, from, to);
    } else if (action === "organico") {
      if (!conta) {
        return NextResponse.json({ error: "Parametro 'conta' eh obrigatorio" }, { status: 400 });
      }
      responseData = await fetchPortalOrganico(conta, period, from, to);
    } else if (action === "preview") {
      if (!conta || !adId) {
        return NextResponse.json({ error: "Parametros 'conta' e 'ad_id' sao obrigatorios" }, { status: 400 });
      }
      responseData = await fetchPortalAdPreview(conta, adId);
    } else if (action === "all") {
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

      responseData = { contas, reports };
    } else {
      return NextResponse.json({ error: "Acao invalida" }, { status: 400 });
    }

    portalMemoryCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    return NextResponse.json(responseData, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error: any) {
    console.error("Erro na API do portal de traqueamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao conectar com o portal de tráfego" },
      { status: 500 }
    );
  }
}
