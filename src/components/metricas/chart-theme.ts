/**
 * Paleta de cores centralizeda para os graficos do dashboard de metricas.
 * usa as variaveis CSS definidas em globals.css para manter sincronia
 * com o sistema de design tokens do projeto.
 */

/** Cores primarias da paleta da marca para graficos */
export const CHART_COLORS = {
  secundar: "#105D8F",
  principal: "#E9E9E9",
  terciar: "#262626",
  extra1: "#5C4C44",
  extra2: "#604F45",
  extra3: "#CC9F6F",
} as const;

/** Paleta sequencial para multi-series (ex: comparativos, pizza) */
export const CHART_PALETTE = [
  CHART_COLORS.secundar,
  CHART_COLORS.extra3,
  CHART_COLORS.extra1,
  CHART_COLORS.extra2,
  "#7BA7CE",
  "#A07858",
  "#3E7BAA",
] as const;

/** Cor do grid de fundo - opacidade baixa do terciario */
export const CHART_GRID_COLOR = "#26262612";

/** Cor do texto de axis e legenda */
export const CHART_TEXT_COLOR = "#26262699";

/** Cor da tooltip customizada */
export const CHART_TOOLTIP_BG = "#FFFFFF";
export const CHART_TOOLTIP_BORDER = "#26262618";

/** duracao padrao das animacoes dos graficos (ms) - leve, sem oscilacoes */
export const CHART_ANIMATION_DURATION = 600;
