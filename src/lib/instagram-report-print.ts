import type { InstagramReportData, InstagramReportHighlight, InstagramReportProfile } from "@/lib/instagram-report";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function number(value: number): string {
  return value.toLocaleString("pt-BR");
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const name = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(year, month - 1, 1));
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

function dateLabel(value: string): string {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00-03:00`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return escapeHtml(new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed));
}

function feedTotal(profile: InstagramReportProfile["totals"]): number {
  return profile.photos + profile.carousels + profile.reels;
}

function pieceTotal(profile: InstagramReportProfile["totals"]): number {
  return feedTotal(profile) + profile.stories;
}

function hasAvailableData(profile: InstagramReportProfile): boolean {
  return Object.values(profile.months).some((month) => month.available);
}

function profileTable(profile: InstagramReportProfile, months: string[]): string {
  const rows = months.map((month) => {
    const counts = profile.months[month];
    if (!counts?.available) {
      return `<tr><th>${escapeHtml(monthLabel(month))}</th><td colspan="6" class="muted">Dados não disponíveis para o período</td></tr>`;
    }
    return `<tr><th>${escapeHtml(monthLabel(month))}</th><td>${number(counts.photos)}</td><td>${number(counts.carousels)}</td><td>${number(counts.reels)}</td><td>${number(feedTotal(counts))}</td><td>${number(counts.stories)}</td><td>${number(pieceTotal(counts))}</td></tr>`;
  }).join("");

  const totals = hasAvailableData(profile)
    ? [profile.totals.photos, profile.totals.carousels, profile.totals.reels, feedTotal(profile.totals), profile.totals.stories, pieceTotal(profile.totals)].map(number)
    : Array(6).fill("N/D");

  return `<table><thead><tr><th>Mês</th><th>Fotos</th><th>Carrosséis</th><th>Reels</th><th>Feed</th><th>Stories</th><th>Total</th></tr></thead><tbody>${rows}<tr class="total"><th>Total disponível</th>${totals.map((value) => `<td>${value}</td>`).join("")}</tr></tbody></table>`;
}

function safeThumbnailUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const trustedHost = host === "instagram.com"
      || host.endsWith(".instagram.com")
      || host.endsWith(".cdninstagram.com")
      || host.endsWith(".fbcdn.net");
    return url.protocol === "https:" && trustedHost ? url.href : null;
  } catch {
    return null;
  }
}

function stat(label: string, value: number | null): string {
  if (value == null) return "";
  return `<div class="highlight-stat"><strong>${number(value)}</strong><span>${label}</span></div>`;
}

function highlightCard(item: InstagramReportHighlight, rank: number): string {
  const sourceClass = item.source === "Pago" ? "paid" : item.source === "Manual" ? "manual" : "organic";
  const imageUrl = safeThumbnailUrl(item.thumbnailUrl);
  const thumbnail = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="Miniatura da publicação" loading="eager">`
    : `<span>Sem imagem</span>`;
  const thumbnailColumn = item.source === "Manual" ? "" : `<div class="highlight-thumbnail">${thumbnail}</div>`;
  const description = item.source === "Manual" && item.description
    ? `<p class="highlight-description">${escapeHtml(item.description)}</p>`
    : "";
  const date = item.date ? ` · ${dateLabel(item.date)}` : "";
  const metrics = [
    stat("visualizações", item.views),
    stat("pessoas alcançadas", item.reach),
    stat("novos seguidores", item.followers ?? null),
    stat("curtidas", item.likes),
    stat("interações", item.interactions),
  ].filter(Boolean).join("");
  const unavailableMetrics = item.source === "Pago" && !metrics
    ? `<p class="metrics-unavailable">Visualizações, alcance e engajamento por anúncio não informados pelo portal.</p>`
    : "";
  const paidResult = item.source === "Pago"
    ? `<p class="paid-result">${number(item.value)} ${escapeHtml(item.metric)}${item.description ? ` · ${escapeHtml(item.description)}` : ""}</p>`
    : "";
  const link = item.link
    ? `<a class="open-publication" href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">Abrir publicação</a>`
    : "";

  return `<li class="highlight-card${item.source === "Manual" ? " highlight-card-no-thumbnail" : ""}">${thumbnailColumn}<div class="highlight-content"><div class="highlight-heading"><strong>${rank}. ${escapeHtml(item.kind)}${date}</strong><em class="source-badge source-${sourceClass}">${escapeHtml(item.source)}</em></div>${description}${metrics ? `<div class="highlight-metrics">${metrics}</div>` : ""}${unavailableMetrics}${paidResult}${link}</div></li>`;
}

function profilePage(profile: InstagramReportProfile, months: string[], pageNumber: number): string {
  const highlights = profile.topHighlights.length
    ? profile.topHighlights.map((item, index) => highlightCard(item, index + 1)).join("")
    : `<li class="muted">${profile.sourceNote ? "Não há destaques manuais disponíveis para este período." : "O portal não retornou destaques para este perfil no período."}</li>`;
  const warnings = profile.highlightWarnings.length
    ? `<p class="note">${profile.highlightWarnings.map(escapeHtml).join(" ")}</p>`
    : "";
  const isManual = Boolean(profile.sourceNote);
  const sourceNote = profile.sourceNote ? `<p class="note">${escapeHtml(profile.sourceNote)}</p>` : "";
  const kpis = hasAvailableData(profile)
    ? [pieceTotal(profile.totals), feedTotal(profile.totals), profile.totals.stories].map(number)
    : ["N/D", "N/D", "N/D"];

  return `<section class="page profile-page"><header><p class="eyebrow">CENTRAL AZUL / INSTAGRAM</p><p class="page-number">${String(pageNumber).padStart(2, "0")}</p></header><h1>${escapeHtml(profile.name)}</h1><p class="subtitle">${profile.username ? `@${escapeHtml(profile.username)} · ` : ""}Resumo de peças no período selecionado${isManual ? " · Dados manuais" : ""}</p><div class="kpis"><div><strong>${kpis[0]}</strong><span>Peças registradas</span></div><div><strong>${kpis[1]}</strong><span>Publicações no feed</span></div><div><strong>${kpis[2]}</strong><span>Stories</span></div></div>${profileTable(profile, months)}<h2>Top 5 geral</h2><ol class="highlights">${highlights}</ol>${warnings}${sourceNote}</section>`;
}

export function renderInstagramReportHtml(report: InstagramReportData): string {
  const months = Object.keys(report.monthlyTotals);
  const totals = report.totals;
  const overallRows = report.profiles.map((profile) => {
    const values = hasAvailableData(profile)
      ? [profile.totals.photos, profile.totals.carousels, profile.totals.reels, feedTotal(profile.totals), profile.totals.stories, pieceTotal(profile.totals)].map(number)
      : Array(6).fill("N/D");
    return `<tr><th>${escapeHtml(profile.name)}${profile.sourceNote ? ` <span class="muted">(dados manuais)</span>` : ""}</th>${values.map((value) => `<td>${value}</td>`).join("")}</tr>`;
  }).join("");
  const monthRows = months.map((month) => {
    const counts = report.monthlyTotals[month];
    return `<tr><th>${escapeHtml(monthLabel(month))} <span class="muted">(${report.monthlyCoverage[month]}/${report.profiles.length} perfis)</span></th><td>${number(counts.photos)}</td><td>${number(counts.carousels)}</td><td>${number(counts.reels)}</td><td>${number(feedTotal(counts))}</td><td>${number(counts.stories)}</td><td>${number(pieceTotal(counts))}</td></tr>`;
  }).join("");
  const generated = escapeHtml(new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(report.generatedAt)));
  const pages = report.profiles.map((profile, index) => profilePage(profile, months, index + 2)).join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório de Instagram | Central Azul</title><style>
    :root{--blue:#105D8F;--ink:#262626;--gray:#687582;--light:#EEF3F6;--line:#DCE4E9;--bronze:#CC9F6F}
    *{box-sizing:border-box}body{margin:0;background:#e9e9e9;color:var(--ink);font:14px Arial,sans-serif}
    .toolbar{max-width:210mm;margin:14px auto;display:flex;justify-content:flex-end}.toolbar button{border:0;border-radius:8px;background:var(--blue);color:#fff;padding:11px 16px;font-weight:700;cursor:pointer}
    .page{position:relative;width:210mm;min-height:297mm;margin:0 auto 14px;padding:19mm 16mm;background:#fff;box-shadow:0 4px 20px #0002;overflow:hidden}.page:before{content:"";position:absolute;left:0;right:0;top:0;height:5mm;background:var(--blue)}
    header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--blue)}.eyebrow{margin:0;font-size:10px;font-weight:bold;letter-spacing:.09em}.page-number{margin:0;color:var(--gray);font-size:11px}
    h1{margin:28px 0 7px;color:var(--blue);font-size:28px}h2{margin:24px 0 8px;color:var(--blue);font-size:17px}.subtitle{margin:0 0 20px;color:var(--gray)}
    .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0}.kpis div{padding:15px;border-radius:8px;background:var(--light)}.kpis strong{display:block;color:var(--blue);font-size:24px}.kpis span{display:block;margin-top:4px;color:var(--gray);font-size:11px}
    table{width:100%;border-collapse:collapse;margin-top:20px;font-size:10px}th,td{padding:10px 7px;border-bottom:1px solid var(--line);text-align:right}th:first-child{text-align:left}thead{background:var(--blue);color:#fff}thead th{font-size:9px}.total{background:#DDEAF2;font-weight:bold}.muted,.note{color:var(--gray)}
    .manual-highlights{margin-top:24px}.manual-highlights td,.manual-highlights th{padding:13px 9px}.manual-highlights td:nth-child(2){text-align:left}.manual-highlights td:nth-child(2) strong{font-size:11px}
    .highlights{list-style:none;margin:10px 0;padding:0}.highlight-card{display:grid;grid-template-columns:68px 1fr;gap:12px;margin-bottom:8px;padding:10px;background:var(--light);border-radius:8px;break-inside:avoid}.highlight-card-no-thumbnail{grid-template-columns:1fr}.highlight-thumbnail{width:68px;height:68px;overflow:hidden;border-radius:6px;background:#dce4e9;display:flex;align-items:center;justify-content:center;color:var(--gray);font-size:8px}.highlight-thumbnail img{width:100%;height:100%;object-fit:cover}.highlight-content{min-width:0}.highlight-heading{display:flex;align-items:center;gap:8px;min-height:18px}.highlight-heading strong{font-size:11px}.highlight-description{margin:4px 0;color:var(--ink);font-size:9px;line-height:1.3}.source-badge{margin-left:auto;padding:2px 6px;border-radius:8px;font-size:7px;font-style:normal;font-weight:500;text-transform:uppercase;white-space:nowrap}.source-organic{background:#E7EDF1;color:#687582}.source-paid{background:#F3E8D9;color:#805B2C}.source-manual{background:#E7EDF1;color:#687582}
    .highlight-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:7px 0}.highlight-stat strong{display:block;color:var(--blue);font-size:14px}.highlight-stat span{display:block;margin-top:1px;color:var(--gray);font-size:8px}.metrics-unavailable,.paid-result{margin:5px 0;color:var(--gray);font-size:8px}.paid-result strong{color:var(--ink)}.open-publication{display:inline-block;margin-top:6px;padding:6px 10px;border-radius:5px;background:var(--blue);color:#fff;font-size:9px;font-weight:bold;text-decoration:none}.note{margin-top:12px;font-size:9px;line-height:1.4}.method{margin-top:14px;color:var(--gray);font-size:9px}
    .print-button{display:block;margin:12px auto 0;border:1px solid var(--blue);background:#fff;color:var(--blue);padding:9px 14px;border-radius:8px}@page{size:A4;margin:0}
    @media print{body{background:#fff}.toolbar,.print-button{display:none!important}.page{width:210mm;height:297mm;min-height:297mm;margin:0;padding:19mm 16mm;box-shadow:none;break-after:page;page-break-after:always}.page:last-child{break-after:auto;page-break-after:auto}}
    @media(max-width:760px){body{font-size:12px}.page{width:100%;min-height:0;padding:28px 20px;margin-bottom:10px;overflow:auto}.toolbar{padding:0 12px}h1{font-size:23px}table{font-size:9px}th,td{padding:7px 3px}.highlight-card{grid-template-columns:56px 1fr;gap:8px;padding:8px}.highlight-thumbnail{width:56px;height:56px}.highlight-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
  </style></head><body><div class="toolbar"><button data-print>Imprimir ou salvar como PDF</button></div><section class="page"><header><p class="eyebrow">CENTRAL AZUL / INSTAGRAM</p><p class="page-number">01</p></header><h1>Produção e destaques</h1><p class="subtitle">${dateLabel(report.startDate)} a ${dateLabel(report.endDate)} · ${report.profiles.length} perfis</p><div class="kpis"><div><strong>${number(feedTotal(totals) + totals.stories)}</strong><span>Peças registradas</span></div><div><strong>${number(feedTotal(totals))}</strong><span>Publicações no feed</span></div><div><strong>${number(totals.stories)}</strong><span>Stories</span></div></div><h2>Quantidade por perfil</h2><table><thead><tr><th>Perfil</th><th>Fotos</th><th>Carrosséis</th><th>Reels</th><th>Feed</th><th>Stories</th><th>Total</th></tr></thead><tbody>${overallRows}<tr class="total"><th>Total disponível</th><td>${number(totals.photos)}</td><td>${number(totals.carousels)}</td><td>${number(totals.reels)}</td><td>${number(feedTotal(totals))}</td><td>${number(totals.stories)}</td><td>${number(feedTotal(totals) + totals.stories)}</td></tr></tbody></table><h2>Consolidado mensal</h2><table><thead><tr><th>Mês</th><th>Fotos</th><th>Carrosséis</th><th>Reels</th><th>Feed</th><th>Stories</th><th>Total</th></tr></thead><tbody>${monthRows}</tbody></table><p class="method">Consulta em ${generated}.</p></section>${pages}<button class="print-button" data-print>Imprimir ou salvar como PDF</button></body></html>`;
}
