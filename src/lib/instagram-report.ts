import type { PortalConta, PortalOrganicoData, PortalOrganicoPost } from "@/lib/portal-api";

export type InstagramPostKind = "Foto" | "Carrossel" | "Reel";

export interface InstagramMonthlyCounts {
  photos: number;
  carousels: number;
  reels: number;
  stories: number;
  available: boolean;
}

export interface InstagramReportPost {
  id: string;
  kind: InstagramPostKind;
  date: string;
  likes: number;
  link: string | null;
}

export interface InstagramReportProfile {
  id: string;
  name: string;
  username: string | null;
  months: Record<string, InstagramMonthlyCounts>;
  totals: Omit<InstagramMonthlyCounts, "available">;
  topPosts: InstagramReportPost[];
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
): InstagramReportProfile {
  const months: InstagramReportProfile["months"] = {};
  const postById = new Map<string, PortalOrganicoPost>();
  let username: string | null = null;
  const firstAvailableMonth = getFirstAvailableMonth(account.primeiro_mes);

  for (const key of monthKeys) {
    const response = responses.get(`${account.id}:${key}`);
    const organico = response instanceof Error ? undefined : response?.organico;
    const available = Boolean((!firstAvailableMonth || key >= firstAvailableMonth) && organico && !organico.erro);
    const posts = available ? organico?.posts ?? [] : [];
    const stories = available ? organico?.stories ?? [] : [];

    if (organico?.username) username = organico.username;
    for (const post of posts) postById.set(post.id, post);

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

  const topPosts = [...postById.values()]
    .sort((a, b) => (Number(b.likes) || 0) - (Number(a.likes) || 0))
    .slice(0, 3)
    .map((post) => ({
      id: post.id,
      kind: getInstagramPostKind(post),
      date: post.data,
      likes: Number(post.likes) || 0,
      link: post.link && isInstagramPostUrl(post.link) ? post.link : null,
    }));

  return { id: account.id, name: account.nome, username, months, totals, topPosts };
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

