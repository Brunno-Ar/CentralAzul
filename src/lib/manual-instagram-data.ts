import {
  addInstagramCounts,
  type InstagramManualHighlight,
  type InstagramReportProfile,
} from "@/lib/instagram-report";

export interface ManualInstagramMonth {
  month: string;
  counts: {
    photos: number;
    carousels: number;
    reels: number;
    stories: number;
  };
  highlights: InstagramManualHighlight[];
}

export interface RankedMapleBearHighlight extends InstagramManualHighlight {
  month: string;
}

export const mapleBearManualMonths: ManualInstagramMonth[] = [
  {
    month: "2026-07",
    counts: { photos: 7, carousels: 7, reels: 1, stories: 23 },
    highlights: [
      { title: "Reel sem título", date: "06/07, 14h04", kind: "Reel", views: 2096, reach: 915 },
      { title: "Meu filho vai confundir o português c...", date: "08/07, 10h31", kind: "Publicação", views: 950, reach: 438 },
      { title: "Férias são uma oportunidade para cria...", date: "14/07, 10h04", kind: "Publicação", views: 932, reach: 408 },
      { title: "O aprendizado também acontece ao a...", date: "10/07, 10h30", kind: "Publicação", views: 917, reach: 459 },
      { title: "Na Maple Bear, acreditamos que a apr...", date: "04/07, 08h02", kind: "Publicação", views: 810, reach: 403 },
    ],
  },
  {
    month: "2026-08",
    counts: { photos: 7, carousels: 5, reels: 0, stories: 24 },
    highlights: [
      { title: "Mais do que conteúdos e atividades, l...", date: "30/08, 10h02", kind: "Publicação", views: 1049, reach: 481 },
      { title: "Escolher uma escola é uma das decisõ...", date: "01/08, 10h02", kind: "Publicação", views: 651, reach: 290 },
      { title: "Muito mais do que aprender um segun...", date: "11/08, 10h04", kind: "Publicação", views: 539, reach: 270 },
      { title: "Na Maple Bear, cada experiência tem ...", date: "22/08, 10h30", kind: "Publicação", views: 504, reach: 279 },
      { title: "Na Maple Bear, incentivamos cada cria...", date: "05/08, 10h03", kind: "Publicação", views: 493, reach: 261 },
    ],
  },
  {
    month: "2026-09",
    counts: { photos: 10, carousels: 3, reels: 0, stories: 16 },
    highlights: [
      { title: "Em nossa Feira do Conhecimento, nos...", date: "26/09, 10h15", kind: "Publicação", views: 836, reach: 476 },
      { title: "Vivendo uma infância feliz, enquanto ...", date: "24/09, 10h05", kind: "Publicação", views: 818, reach: 333 },
      { title: "O futuro começa nas escolhas que faz...", date: "17/09, 10h04", kind: "Publicação", views: 740, reach: 349 },
      { title: "Cada aprendizado vivido hoje pode ab...", date: "02/09, 12h32", kind: "Publicação", views: 634, reach: 284 },
      { title: "Por trás de uma nova língua, existe um...", date: "21/09, 10h03", kind: "Publicação", views: 531, reach: 263 },
    ],
  },
  {
    month: "2026-10",
    counts: { photos: 7, carousels: 2, reels: 2, stories: 31 },
    highlights: [
      { title: "Transformar a aprendizagem numa jornada...", date: "14/10", kind: "Publicação", views: 3268, reach: 1639, followers: 11, thumbnailUrl: "/instagram-manual/maple-bear/2026-10-14.jpg" },
      { title: "Na Maple Bear, o idioma vai muito além...", date: "29/10", kind: "Publicação", views: 648, reach: 349, followers: 0, thumbnailUrl: "/instagram-manual/maple-bear/2026-10-29.jpg" },
      { title: "A infância é a janela mais rica e propícia...", date: "08/10", kind: "Publicação", views: 637, reach: 273, followers: 0, thumbnailUrl: "/instagram-manual/maple-bear/2026-10-08.jpg" },
      { title: "E se cada passo do seu filho fosse um...", date: "23/10", kind: "Publicação", views: 603, reach: 287, followers: 0, thumbnailUrl: "/instagram-manual/maple-bear/2026-10-23.jpg" },
      { title: "É nas pequenas coisas que surgem as...", date: "31/10", kind: "Publicação", views: 572, reach: 285, followers: 0, thumbnailUrl: "/instagram-manual/maple-bear/2026-10-31.jpg" },
    ],
  },
];

export function getMapleBearTopHighlights(monthKeys?: string[]): RankedMapleBearHighlight[] {
  const includedMonths = monthKeys ? new Set(monthKeys) : null;
  return mapleBearManualMonths
    .filter(({ month }) => !includedMonths || includedMonths.has(month))
    .flatMap(({ month, highlights }) => highlights.map((highlight) => ({ ...highlight, month })))
    .sort((left, right) => right.views - left.views)
    .slice(0, 5);
}

export function createMapleBearManualProfile(monthKeys: string[]): InstagramReportProfile {
  const monthMap = new Map(mapleBearManualMonths.map((entry) => [entry.month, entry]));
  const hasManualData = monthKeys.some((month) => monthMap.has(month));

  const months: InstagramReportProfile["months"] = Object.fromEntries(
    monthKeys.map((month) => {
      const source = monthMap.get(month);
      return [month, source
        ? { ...source.counts, available: true }
        : { photos: 0, carousels: 0, reels: 0, stories: 0, available: false }];
    }),
  );
  const totals = Object.values(months)
    .filter((month) => month.available)
    .reduce((sum, month) => addInstagramCounts(sum, month), { photos: 0, carousels: 0, reels: 0, stories: 0 });
  const topHighlights = getMapleBearTopHighlights(monthKeys)
    .map((highlight) => {
      const [datePart, time] = highlight.date.split(", ");
      const [day] = datePart.split("/");
      const [hour, minute] = time?.replace("h", ":").split(":") ?? ["12", "00"];
      const date = `${highlight.month}-${day}T${hour}:${minute}:00-03:00`;
      return {
        id: `maple-bear:${highlight.month}:${day}`,
        source: "Manual" as const,
        kind: highlight.kind,
        date,
        metric: "visualizações",
        value: highlight.views,
        views: highlight.views,
        reach: highlight.reach,
        followers: highlight.followers ?? null,
        thumbnailUrl: highlight.thumbnailUrl ?? null,
        likes: null,
        interactions: null,
        relativeScore: highlight.views,
        description: highlight.title,
        link: null,
      };
    });

  return {
    id: "maple-bear-manual",
    name: "Maple Bear",
    username: null,
    months,
    totals,
    topHighlights,
    highlightWarnings: [],
    sourceNote: hasManualData
      ? "Dados manuais enviados para Maple Bear. Os destaques incluem visualizações, alcance e novos seguidores quando informados."
      : "O levantamento manual disponível cobre julho a outubro de 2026. Não há dados manuais para o período selecionado.",
  };
}
