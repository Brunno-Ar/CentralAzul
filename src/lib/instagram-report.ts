import type {
  PortalConta,
  PortalCriativoGrupo,
  PortalOrganicoData,
  PortalOrganicoPost,
  PortalOrganicoTopData,
} from "@/lib/portal-api";

export type InstagramPostKind = "Foto" | "Carrossel" | "Reel";

export interface InstagramMonthlyCounts {
  photos: number;
  carousels: number;
  reels: number;
  stories: number;
  available: boolean;
}

export interface InstagramReportHighlight {
  id: string;
  source: "Orgânico" | "Pago" | "Manual";
  kind: string;
  date: string | null;
  metric: string;
  value: number;
  thumbnailUrl: string | null;
  views: number | null;
  reach: number | null;
  likes: number | null;
  interactions: number | null;
  relativeScore: number;
  description: string;
  link: string | null;
}

export interface InstagramManualHighlight {
  title: string;
  date: string;
  kind: string;
  views: number;
  reach: number;
}

export interface InstagramReportProfile {
  id: string;
  name: string;
  username: string | null;
  months: Record<string, InstagramMonthlyCounts>;
  totals: Omit<InstagramMonthlyCounts, "available">;
  topHighlights: InstagramReportHighlight[];
  highlightWarnings: string[];
  sourceNote?: string;
}

export interface InstagramReportData {
  fromMonth: string;
  toMonth: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  profiles: InstagramReportProfile[];
  totals: Omit<InstagramMonthlyCounts, "available">;
  monthlyTotals: Record<string, Omit<InstagramMonthlyCounts, "available">>;
  monthlyCoverage: Record<string, number>;
}

export function getInstagramPostKind(post: PortalOrganicoPost): InstagramPostKind {
  if (post.produto?.toUpperCase() === "REELS") return "Reel";
  if (post.tipo?.toUpperCase() === "CAROUSEL_ALBUM") return "Carrossel";
  return "Foto";
}

function normalizeHighlightDate(value: string | number | null | undefined): string | null {
  if (value == null || value === "") return null;
  const numericValue = typeof value === "number" ? value : /^\d+$/.test(value) ? Number(value) : null;
  const parsed = numericValue == null
    ? new Date(value)
    : new Date(numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function optionalMetric(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return Number(value);
}

export function addInstagramCounts<T extends { photos: number; carousels: number; reels: number; stories: number }>(
  left: T,
  right: { photos: number; carousels: number; reels: number; stories: number },
) {
  return {
    photos: left.photos + right.photos,
    carousels: left.carousels + right.carousels,
    reels: left.reels + right.reels,
    stories: left.stories + right.stories,
  };
}

export function getFirstAvailableMonth(value: string): string | null {
  const normalizedValue = value ?? "";
  const yearFirst = normalizedValue.match(/^(\d{4})[-/](\d{1,2})/);
  if (yearFirst && Number(yearFirst[2]) >= 1 && Number(yearFirst[2]) <= 12) {
    return `${yearFirst[1]}-${String(Number(yearFirst[2])).padStart(2, "0")}`;
  }

  const monthFirst = normalizedValue.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthFirst && Number(monthFirst[1]) >= 1 && Number(monthFirst[1]) <= 12) {
    return `${monthFirst[2]}-${String(Number(monthFirst[1])).padStart(2, "0")}`;
  }
  return null;
}

export function createInstagramReportProfile(
  account: PortalConta,
  monthKeys: string[],
  responses: Map<string, PortalOrganicoData | Error>,
  organicTop?: PortalOrganicoTopData | Error,
  paidGroups: PortalCriativoGrupo[] | Error = [],
): InstagramReportProfile {
  const months: InstagramReportProfile["months"] = {};
  let username: string | null = null;
  const firstAvailableMonth = getFirstAvailableMonth(account.primeiro_mes);

  for (const key of monthKeys) {
    const response = responses.get(`${account.id}:${key}`);
    const organico = response instanceof Error ? undefined : response?.organico;
    const available = Boolean((!firstAvailableMonth || key >= firstAvailableMonth) && organico && !organico.erro);
    const posts = available ? organico?.posts ?? [] : [];
    const stories = available ? organico?.stories ?? [] : [];

    if (organico?.username) username = organico.username;
    months[key] = {
      photos: posts.filter((post) => getInstagramPostKind(post) === "Foto").length,
      carousels: posts.filter((post) => getInstagramPostKind(post) === "Carrossel").length,
      reels: posts.filter((post) => getInstagramPostKind(post) === "Reel").length,
      stories: stories.length,
      available,
    };
  }

  const totals = Object.values(months).reduce(
    (sum, month) => addInstagramCounts(sum, month),
    { photos: 0, carousels: 0, reels: 0, stories: 0 },
  );

  const candidates: (InstagramReportHighlight & { metricGroup: string })[] = [];
  const organic = organicTop instanceof Error ? undefined : organicTop?.top;
  const normalizedPaidGroups = paidGroups instanceof Error ? [] : paidGroups;
  const organicTopUnavailable = organicTop instanceof Error || !organicTop || Boolean(organic?.erro);
  const highlightWarnings = [
    ...(organicTopUnavailable ? ["Destaques orgânicos indisponíveis neste período."] : []),
    ...(paidGroups instanceof Error ? ["Destaques pagos indisponíveis neste período."] : []),
  ];
  if (organic && !organic.erro) {
    for (const post of organic.posts ?? []) {
      const views = Number(post.visualizacoes) || 0;
      const value = views;
      if (value <= 0) continue;
      candidates.push({
        id: `organic-post:${post.id}`,
        source: "Orgânico",
        kind: getInstagramPostKind({
          id: post.id,
          data: String(post.data),
          tipo: post.tipo,
          produto: post.produto,
          likes: Number(post.curtidas) || 0,
          link: post.link,
        }),
        date: normalizeHighlightDate(post.data),
        metric: "visualizações",
        value,
        thumbnailUrl: post.img ?? null,
        views,
        reach: Number(post.alcance) || 0,
        likes: Number(post.curtidas) || 0,
        interactions: Number(post.interacoes) || 0,
        relativeScore: 0,
        description: `${Number(post.visualizacoes) || 0} visualizações · ${Number(post.curtidas) || 0} curtidas · ${Number(post.interacoes) || 0} interações`,
        link: post.link && isInstagramPostUrl(post.link) ? post.link : null,
        metricGroup: "organic-views",
      });
    }
    for (const story of organic.stories ?? []) {
      const views = Number(story.visualizacoes) || 0;
      const value = views;
      if (value <= 0) continue;
      candidates.push({
        id: `organic-story:${story.id ?? story.data}`,
        source: "Orgânico",
        kind: "Story",
        date: normalizeHighlightDate(story.data),
        metric: "visualizações",
        value,
        thumbnailUrl: story.img ?? null,
        views,
        reach: Number(story.alcance) || 0,
        likes: null,
        interactions: Number(story.interacoes) || 0,
        relativeScore: 0,
        description: `${Number(story.visualizacoes) || 0} visualizações · ${Number(story.respostas) || 0} respostas · ${Number(story.interacoes) || 0} interações`,
        link: null,
        metricGroup: "organic-views",
      });
    }
  }

  const seenAds = new Set<string>();
  for (const group of normalizedPaidGroups) {
    const unit = String(group.unidade || "resultados").trim().toLocaleLowerCase("pt-BR");
    for (const ad of group.cards ?? []) {
      if (seenAds.has(ad.id)) continue;
      seenAds.add(ad.id);
      const value = Number(ad.valor) || 0;
      if (value <= 0) continue;
      candidates.push({
        id: `paid-ad:${ad.id}`,
        source: "Pago",
        kind: "Anúncio pago",
        date: null,
        metric: unit,
        value,
        thumbnailUrl: ad.thumb || null,
        views: optionalMetric(ad.visualizacoes),
        reach: optionalMetric(ad.alcance),
        likes: optionalMetric(ad.curtidas),
        interactions: optionalMetric(ad.interacoes),
        relativeScore: 0,
        description: [ad.nome, ad.sub].filter(Boolean).join(" · "),
        link: null,
        metricGroup: `paid:${unit}`,
      });
    }
  }

  const candidatesByMetric = new Map<string, typeof candidates>();
  for (const candidate of candidates) {
    const group = candidatesByMetric.get(candidate.metricGroup) ?? [];
    group.push(candidate);
    candidatesByMetric.set(candidate.metricGroup, group);
  }
  for (const group of candidatesByMetric.values()) {
    const average = group.reduce((sum, candidate) => sum + candidate.value, 0) / group.length;
    for (const candidate of group) candidate.relativeScore = average > 0 ? candidate.value / average : 0;
  }

  const topHighlights = candidates
    .sort((a, b) => b.relativeScore - a.relativeScore || a.id.localeCompare(b.id))
    .slice(0, 5)
    .map(({ metricGroup: _metricGroup, ...highlight }) => {
      void _metricGroup;
      return highlight;
    });

  return { id: account.id, name: account.nome, username, months, totals, topHighlights, highlightWarnings };
}

export function isInstagramPostUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "instagram.com" || url.hostname.endsWith(".instagram.com"));
  } catch {
    return false;
  }
}

export function createInstagramReportData(
  fromMonth: string,
  toMonth: string,
  profiles: InstagramReportProfile[],
  monthKeys: string[],
): InstagramReportData {
  const empty = () => ({ photos: 0, carousels: 0, reels: 0, stories: 0 });
  const totals = profiles.reduce((sum, profile) => addInstagramCounts(sum, profile.totals), empty());
  const monthlyTotals = Object.fromEntries(
    monthKeys.map((key) => [
      key,
      profiles.reduce((sum, profile) => {
        const month = profile.months[key];
        return month?.available ? addInstagramCounts(sum, month) : sum;
      }, empty()),
    ]),
  );
  const monthlyCoverage = Object.fromEntries(
    monthKeys.map((key) => [key, profiles.filter((profile) => profile.months[key]?.available).length]),
  );

  return {
    fromMonth,
    toMonth,
    startDate: `${fromMonth}-01`,
    endDate: getMonthBounds(toMonth).to,
    generatedAt: new Date().toISOString(),
    profiles,
    totals,
    monthlyTotals,
    monthlyCoverage,
  };
}

export function getMonthKeys(fromMonth: string, toMonth: string): string[] {
  const [startYear, startMonth] = fromMonth.split("-").map(Number);
  const [endYear, endMonth] = toMonth.split("-").map(Number);
  const result: string[] = [];
  for (let year = startYear, month = startMonth; year < endYear || (year === endYear && month <= endMonth); ) {
    result.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return result;
}

export function getCurrentInstagramReportMonth(): string {
  return getCurrentInstagramReportDate().slice(0, 7);
}

export function getCurrentInstagramReportDate(): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function getMonthBounds(key: string): { from: string; to: string } {
  const [year, month] = key.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const today = getCurrentInstagramReportDate();
  const isCurrentMonth = key === today.slice(0, 7);
  return {
    from: `${key}-01`,
    to: `${key}-${isCurrentMonth ? today.slice(8, 10) : String(lastDay).padStart(2, "0")}`,
  };
}

