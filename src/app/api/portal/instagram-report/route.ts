import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { fetchPortalContas, fetchPortalOrganico, getPortalToken, type PortalOrganicoData } from "@/lib/portal-api";
import {
  createInstagramReportData,
  createInstagramReportProfile,
  getCurrentInstagramReportMonth,
  getFirstAvailableMonth,
  getMonthBounds,
  getMonthKeys,
} from "@/lib/instagram-report";

export const dynamic = "force-dynamic";
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const REPORT_CACHE_TTL_MS = 3 * 60 * 1000;
const reportCache = new Map<string, { data: ReturnType<typeof createInstagramReportData>; timestamp: number }>();

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const rateLimitResponse = await rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const fromMonth = request.nextUrl.searchParams.get("from") || "";
  const toMonth = request.nextUrl.searchParams.get("to") || "";
  if (!MONTH_PATTERN.test(fromMonth) || !MONTH_PATTERN.test(toMonth) || fromMonth > toMonth) {
    return NextResponse.json({ error: "Informe um intervalo de meses válido." }, { status: 400 });
  }
  const currentMonth = getCurrentInstagramReportMonth();
  if (toMonth > currentMonth) {
    return NextResponse.json({ error: "O mês final não pode estar no futuro." }, { status: 400 });
  }

  const monthKeys = getMonthKeys(fromMonth, toMonth);
  if (monthKeys.length > 12) {
    return NextResponse.json({ error: "O relatório aceita até 12 meses por vez." }, { status: 400 });
  }

  const cacheKey = `${fromMonth}:${toMonth}`;
  const cached = reportCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < REPORT_CACHE_TTL_MS) {
    return NextResponse.json(cached.data, { headers: { "Cache-Control": "private, no-store, max-age=0", "X-Report-Cache": "HIT" } });
  }

  try {
    const accounts = await fetchPortalContas();
    await getPortalToken();
    const responses = new Map<string, PortalOrganicoData | Error>();
    const jobs = accounts.flatMap((account) => {
      const firstAvailableMonth = getFirstAvailableMonth(account.primeiro_mes);
      return monthKeys
        .filter((month) => !firstAvailableMonth || month >= firstAvailableMonth)
        .map((month) => ({ account, month }));
    });

    for (let index = 0; index < jobs.length; index += 4) {
      const batch = jobs.slice(index, index + 4);
      await Promise.all(batch.map(async ({ account, month }) => {
        const { from, to } = getMonthBounds(month);
        try {
          const data = await fetchPortalOrganico(account.id, "custom", from, to);
          responses.set(`${account.id}:${month}`, data);
        } catch (error) {
          responses.set(`${account.id}:${month}`, error instanceof Error ? error : new Error("Falha ao carregar o período."));
        }
      }));
    }

    const profiles = accounts.map((account) => createInstagramReportProfile(account, monthKeys, responses));
    if (accounts.length > 0 && profiles.every((profile) => !Object.values(profile.months).some((month) => month.available))) {
      return NextResponse.json({ error: "O Portal CP não retornou dados orgânicos para este período. Tente novamente mais tarde." }, { status: 502 });
    }
    const report = createInstagramReportData(fromMonth, toMonth, profiles, monthKeys);
    reportCache.set(cacheKey, { data: report, timestamp: Date.now() });
    if (reportCache.size > 20) reportCache.delete(reportCache.keys().next().value!);
    return NextResponse.json(report, {
      headers: { "Cache-Control": "private, no-store, max-age=0", "X-Report-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Erro ao gerar dados do relatório de Instagram:", error);
    return NextResponse.json({ error: "Não foi possível buscar os dados do Portal CP." }, { status: 502 });
  }
}
