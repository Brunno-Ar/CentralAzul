import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createMapleBearManualProfile } from "@/lib/manual-instagram-data";
import { rateLimit } from "@/lib/rate-limit";
import {
  fetchPortalContas,
  fetchPortalOrganico,
  fetchPortalOrganicoTop,
  fetchPortalReport,
  getPortalToken,
  type PortalCriativoGrupo,
  type PortalOrganicoData,
  type PortalOrganicoTopData,
} from "@/lib/portal-api";
import {
  createInstagramReportData,
  createInstagramReportProfile,
  getCurrentInstagramReportDate,
  getCurrentInstagramReportMonth,
  getFirstAvailableMonth,
  getMonthBounds,
  getMonthKeys,
} from "@/lib/instagram-report";

export const dynamic = "force-dynamic";
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MANUAL_MAPLE_BEAR_SCOPE = "maple-bear-manual";
const REPORT_CACHE_TTL_MS = 3 * 60 * 1000;
const reportCache = new Map<string, { data: ReturnType<typeof createInstagramReportData>; timestamp: number }>();

function isValidCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function isMapleBearAccount(account: { id: string; nome: string }): boolean {
  return /maple\s*bear/i.test(account.nome) || /maple[-_]?bear/i.test(account.id);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const rateLimitResponse = await rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const params = request.nextUrl.searchParams;
  const mode = params.get("mode") || "months";
  const accountScope = params.get("account") || "all";
  if (mode !== "months" && mode !== "days") {
    return NextResponse.json({ error: "Selecione um formato de período válido." }, { status: 400 });
  }
  if (accountScope.length > 128) {
    return NextResponse.json({ error: "Selecione uma unidade válida." }, { status: 400 });
  }

  const currentMonth = getCurrentInstagramReportMonth();
  const currentDate = getCurrentInstagramReportDate();
  let fromMonth = "";
  let toMonth = "";
  let referenceMonth: string | undefined;
  let startDate = "";
  let endDate = "";
  let dateRange: { from: string; to: string } | undefined;
  let monthKeys: string[];

  if (mode === "months") {
    fromMonth = params.get("from") || "";
    toMonth = params.get("to") || "";
    if (!MONTH_PATTERN.test(fromMonth) || !MONTH_PATTERN.test(toMonth) || fromMonth > toMonth) {
      return NextResponse.json({ error: "Informe um intervalo de meses válido." }, { status: 400 });
    }
    if (toMonth > currentMonth) {
      return NextResponse.json({ error: "O mês final não pode estar no futuro." }, { status: 400 });
    }
    monthKeys = getMonthKeys(fromMonth, toMonth);
    if (monthKeys.length > 12) {
      return NextResponse.json({ error: "O relatório aceita até 12 meses por vez." }, { status: 400 });
    }
    startDate = `${fromMonth}-01`;
    endDate = getMonthBounds(toMonth).to;
  } else {
    referenceMonth = params.get("reference") || "";
    startDate = params.get("from") || "";
    endDate = params.get("to") || "";
    if (!MONTH_PATTERN.test(referenceMonth) || referenceMonth > currentMonth) {
      return NextResponse.json({ error: "Selecione um mês de referência válido." }, { status: 400 });
    }
    if (!isValidCalendarDate(startDate) || !isValidCalendarDate(endDate) || startDate > endDate) {
      return NextResponse.json({ error: "Informe um intervalo de dias válido." }, { status: 400 });
    }
    if (startDate.slice(0, 7) !== referenceMonth || endDate.slice(0, 7) !== referenceMonth) {
      return NextResponse.json({ error: "As datas precisam estar dentro do mês de referência." }, { status: 400 });
    }
    if (endDate > currentDate) {
      return NextResponse.json({ error: "A data final não pode estar no futuro." }, { status: 400 });
    }
    fromMonth = referenceMonth;
    toMonth = referenceMonth;
    monthKeys = [referenceMonth];
    dateRange = { from: startDate, to: endDate };
  }

  try {
    const accounts = await fetchPortalContas();
    await getPortalToken();

    const selectedAccount = accountScope === "all" || accountScope === MANUAL_MAPLE_BEAR_SCOPE
      ? undefined
      : accounts.find((account) => account.id === accountScope);
    if (accountScope !== "all" && accountScope !== MANUAL_MAPLE_BEAR_SCOPE && !selectedAccount) {
      return NextResponse.json({ error: "A unidade selecionada não existe no Portal CP." }, { status: 404 });
    }

    const targetAccounts = accountScope === "all" ? accounts : selectedAccount ? [selectedAccount] : [];
    const portalAccounts = targetAccounts.filter((account) => !isMapleBearAccount(account));
    const includeManualMapleBear = accountScope === "all"
      || accountScope === MANUAL_MAPLE_BEAR_SCOPE
      || Boolean(selectedAccount && isMapleBearAccount(selectedAccount));
    const scopeLabel = accountScope === "all"
      ? "Todas as unidades"
      : includeManualMapleBear
        ? "Instagram - Maple Bear (dados manuais)"
        : selectedAccount?.nome || "Unidade selecionada";

    const cacheKey = [mode, accountScope, fromMonth, toMonth, referenceMonth || "", startDate, endDate].join(":");
    const cached = reportCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < REPORT_CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: { "Cache-Control": "private, no-store, max-age=0", "X-Report-Cache": "HIT" },
      });
    }

    const responses = new Map<string, PortalOrganicoData | Error>();
    const organicTopResponses = new Map<string, PortalOrganicoTopData | Error>();
    const paidAdResponses = new Map<string, PortalCriativoGrupo[] | Error>();
    const jobs = portalAccounts.flatMap((account) => {
      const firstAvailableMonth = getFirstAvailableMonth(account.primeiro_mes);
      return monthKeys
        .filter((month) => !firstAvailableMonth || month >= firstAvailableMonth)
        .map((month) => ({ account, month }));
    });

    for (let index = 0; index < jobs.length; index += 4) {
      const batch = jobs.slice(index, index + 4);
      await Promise.all(batch.map(async ({ account, month }) => {
        const bounds = getMonthBounds(month);
        try {
          const data = await fetchPortalOrganico(account.id, "custom", bounds.from, bounds.to);
          responses.set(`${account.id}:${month}`, data);
        } catch (error) {
          responses.set(`${account.id}:${month}`, error instanceof Error ? error : new Error("Falha ao carregar o período."));
        }
      }));
    }

    const reportBounds = { from: startDate, to: endDate };
    for (let index = 0; index < portalAccounts.length; index += 4) {
      const batch = portalAccounts.slice(index, index + 4);
      await Promise.all(batch.map(async (account) => {
        const [topResult, paidResult] = await Promise.allSettled([
          fetchPortalOrganicoTop(account.id, "custom", reportBounds.from, reportBounds.to),
          fetchPortalReport(account.id, "custom", reportBounds.from, reportBounds.to),
        ]);
        organicTopResponses.set(
          account.id,
          topResult.status === "fulfilled" ? topResult.value : topResult.reason instanceof Error ? topResult.reason : new Error("Falha ao carregar destaques orgânicos."),
        );
        paidAdResponses.set(
          account.id,
          paidResult.status === "fulfilled" ? paidResult.value.criativos ?? [] : paidResult.reason instanceof Error ? paidResult.reason : new Error("Falha ao carregar destaques pagos."),
        );
      }));
    }

    const portalProfiles = portalAccounts.map((account) => createInstagramReportProfile(
      account,
      monthKeys,
      responses,
      organicTopResponses.get(account.id),
      paidAdResponses.get(account.id) ?? new Error("Falha ao carregar destaques pagos."),
      dateRange,
    ));
    if (portalAccounts.length > 0 && portalProfiles.every((profile) => !Object.values(profile.months).some((month) => month.available))) {
      return NextResponse.json({ error: "O Portal CP não retornou dados orgânicos para este período. Tente novamente mais tarde." }, { status: 502 });
    }

    const profiles = includeManualMapleBear
      ? [...portalProfiles, createMapleBearManualProfile(monthKeys, dateRange)]
      : portalProfiles;
    const report = createInstagramReportData(fromMonth, toMonth, profiles, monthKeys, {
      mode,
      referenceMonth,
      startDate,
      endDate,
      scopeLabel,
    });
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
