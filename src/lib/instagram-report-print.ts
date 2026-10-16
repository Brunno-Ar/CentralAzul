import type { InstagramReportData, InstagramReportProfile } from "@/lib/instagram-report";

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
  const [year, month, day] = value.slice(0, 10).split("-");
  return escapeHtml(`${day}/${month}/${year}`);
}

function feedTotal(profile: InstagramReportProfile["totals"]): number {
  return profile.photos + profile.carousels + profile.reels;
}

function pieceTotal(profile: InstagramReportProfile["totals"]): number {
  return feedTotal(profile) + profile.stories;
}

function profileTable(profile: InstagramReportProfile, months: string[]): string {
  const rows = months.map((month) => {
    const counts = profile.months[month];
    if (!counts?.available) {
      return `<tr><th>${escapeHtml(monthLabel(month))}</th><td colspan="6" class="muted">Não disponível no portal</td></tr>`;
    }
    return `<tr><th>${escapeHtml(monthLabel(month))}</th><td>${number(counts.photos)}</td><td>${number(counts.carousels)}</td><td>${number(counts.reels)}</td><td>${number(feedTotal(counts))}</td><td>${number(counts.stories)}</td><td>${number(pieceTotal(counts))}</td></tr>`;
  }).join("");

  return `<table><thead><tr><th>Mês</th><th>Fotos</th><th>Carrosséis</th><th>Reels</th><th>Feed</th><th>Stories</th><th>Total</th></tr></thead><tbody>${rows}<tr class="total"><th>Total disponível</th><td>${number(profile.totals.photos)}</td><td>${number(profile.totals.carousels)}</td><td>${number(profile.totals.reels)}</td><td>${number(feedTotal(profile.totals))}</td><td>${number(profile.totals.stories)}</td><td>${number(pieceTotal(profile.totals))}</td></tr></tbody></table>`;
}

function profilePage(profile: InstagramReportProfile, months: string[], index: number): string {
  const highlights = profile.topPosts.length
    ? profile.topPosts.map((post, rank) => {
        const link = post.link
          ? `<a href="${escapeHtml(post.link)}" target="_blank" rel="noreferrer">Abrir publicação</a>`
          : `<span class="muted">Link indisponível</span>`;
        return `<li><strong>${rank + 1}. ${escapeHtml(post.kind)}</strong><span>${dateLabel(post.date)} · ${number(post.likes)} curtidas</span>${link}</li>`;
      }).join("")
    : `<li class="muted">Nenhuma publicação de feed disponível para ranqueamento neste período.</li>`;

  return `<section class="page profile-page"><header><p class="eyebrow">CENTRAL AZUL / INSTAGRAM ORGÂNICO</p><p class="page-number">${String(index + 1).padStart(2, "0")}</p></header><h1>${escapeHtml(profile.name)}</h1><p class="subtitle">${profile.username ? `@${escapeHtml(profile.username)} · ` : ""}Resumo de peças no período selecionado</p><div class="kpis"><div><strong>${number(pieceTotal(profile.totals))}</strong><span>Peças totais</span></div><div><strong>${number(feedTotal(profile.totals))}</strong><span>Publicações no feed</span></div><div><strong>${number(profile.totals.stories)}</strong><span>Stories</span></div></div>${profileTable(profile, months)}<h2>Peças de maior destaque</h2><p class="muted">Até três publicações com mais curtidas registradas pelo portal.</p><ol class="highlights">${highlights}</ol><p class="note">O portal não disponibiliza visualizações individuais neste relatório. Stories não possuem métricas individuais para ranking.</p></section>`;
}

export function renderInstagramReportHtml(report: InstagramReportData): string {
  const months = Object.keys(report.monthlyTotals);
  const totals = report.totals;
  const overallRows = report.profiles.map((profile) => `<tr><th>${escapeHtml(profile.name)}</th><td>${number(profile.totals.photos)}</td><td>${number(profile.totals.carousels)}</td><td>${number(profile.totals.reels)}</td><td>${number(feedTotal(profile.totals))}</td><td>${number(profile.totals.stories)}</td><td>${number(pieceTotal(profile.totals))}</td></tr>`).join("");
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
  const pages = report.profiles.map((profile, index) => profilePage(profile, months, index + 1)).join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório de Instagram | Central Azul</title><style>
    :root{--blue:#105D8F;--ink:#262626;--gray:#687582;--light:#EEF3F6;--line:#DCE4E9;--bronze:#CC9F6F}*{box-sizing:border-box}body{margin:0;background:#e9e9e9;color:var(--ink);font:14px Arial,sans-serif}.toolbar{max-width:210mm;margin:14px auto;display:flex;justify-content:flex-end}.toolbar button{border:0;border-radius:8px;background:var(--blue);color:#fff;padding:11px 16px;font-weight:700;cursor:pointer}.page{position:relative;width:210mm;min-height:297mm;margin:0 auto 14px;padding:19mm 16mm;background:#fff;box-shadow:0 4px 20px #0002;overflow:hidden}.page:before{content:"";position:absolute;left:0;right:0;top:0;height:5mm;background:var(--blue)}header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--blue)}.eyebrow{margin:0;font-size:10px;font-weight:bold;letter-spacing:.09em}.page-number{margin:0;color:var(--gray);font-size:11px}h1{margin:28px 0 7px;color:var(--blue);font-size:28px}h2{margin:28px 0 8px;color:var(--blue);font-size:17px}.subtitle{margin:0 0 20px;color:var(--gray)}.period{color:var(--gray);font-size:12px}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0}.kpis div{padding:15px;border-radius:8px;background:var(--light)}.kpis strong{display:block;color:var(--blue);font-size:24px}.kpis span{display:block;margin-top:4px;color:var(--gray);font-size:11px}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:10px}th,td{padding:10px 7px;border-bottom:1px solid var(--line);text-align:right}th:first-child{text-align:left}thead{background:var(--blue);color:#fff}thead th{font-size:9px}.total{background:#DDEAF2;font-weight:bold}.muted,.note{color:var(--gray)}.highlights{list-style:none;margin:14px 0;padding:0}.highlights li{display:grid;grid-template-columns:1fr auto;gap:5px 12px;margin-bottom:9px;padding:12px;background:var(--light);border-radius:7px}.highlights li strong{font-size:12px}.highlights li span{color:var(--gray);font-size:11px}.highlights li a{grid-column:1/-1;color:var(--blue);font-size:11px;font-weight:bold;text-decoration:none}.note{margin-top:20px;font-size:11px;line-height:1.5}.method{margin-top:28px;padding:13px;background:var(--light);border-left:3px solid var(--bronze);font-size:11px;line-height:1.55}.print-button{display:block;margin:12px auto 0;border:1px solid var(--blue);background:#fff;color:var(--blue);padding:9px 14px;border-radius:8px}@page{size:A4;margin:0}@media print{body{background:#fff}.toolbar,.print-button{display:none!important}.page{width:210mm;height:297mm;min-height:297mm;margin:0;padding:19mm 16mm;box-shadow:none;break-after:page;page-break-after:always}.page:last-child{break-after:auto;page-break-after:auto}a{color:var(--blue)}}@media(max-width:760px){body{font-size:12px}.page{width:100%;min-height:0;padding:28px 20px;margin-bottom:10px;overflow:auto}.toolbar{padding:0 12px}h1{font-size:23px}table{font-size:9px}th,td{padding:7px 3px}}
  </style></head><body><div class="toolbar"><button data-print>Imprimir ou salvar como PDF</button></div><section class="page"><header><p class="eyebrow">CENTRAL AZUL / INSTAGRAM ORGÂNICO</p><p class="page-number">01</p></header><h1>Produção e destaques</h1><p class="subtitle">${dateLabel(report.startDate)} a ${dateLabel(report.endDate)} · ${report.profiles.length} perfis</p><div class="kpis"><div><strong>${number(feedTotal(totals) + totals.stories)}</strong><span>Peças registradas</span></div><div><strong>${number(feedTotal(totals))}</strong><span>Publicações no feed</span></div><div><strong>${number(totals.stories)}</strong><span>Stories</span></div></div><h2>Quantidade por perfil</h2><table><thead><tr><th>Perfil</th><th>Fotos</th><th>Carrosséis</th><th>Reels</th><th>Feed</th><th>Stories</th><th>Total</th></tr></thead><tbody>${overallRows}<tr class="total"><th>Total disponível</th><td>${number(totals.photos)}</td><td>${number(totals.carousels)}</td><td>${number(totals.reels)}</td><td>${number(feedTotal(totals))}</td><td>${number(totals.stories)}</td><td>${number(feedTotal(totals) + totals.stories)}</td></tr></tbody></table><h2>Consolidado mensal</h2><table><thead><tr><th>Mês</th><th>Fotos</th><th>Carrosséis</th><th>Reels</th><th>Feed</th><th>Stories</th><th>Total</th></tr></thead><tbody>${monthRows}</tbody></table><p class="method"><strong>Critérios:</strong> Feed soma fotos, carrosséis e Reels. Total soma feed e Stories. O consolidado mensal informa quantos perfis tinham dados naquele mês. Os destaques usam curtidas acumuladas na consulta. Visualizações individuais não são fornecidas pela fonte. Relatório consultado em ${generated}.</p></section>${pages}<button class="print-button" data-print>Imprimir ou salvar como PDF</button></body></html>`;
}
