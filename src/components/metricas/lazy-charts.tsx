"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./ChartSkeleton";

/**
 * Wrappers de lazy loading para todos os componentes de grafico do dashboard.
 *
 * Usa next/dynamic para code-splitar cada grafico em seu proprio chunk,
 * reduzindo o JavaScript inicial da pagina e melhorando o tempo de
 * primeira exibicao (TTV). Cada wrapper inclui um skeleton proprio
 * durante o carregamento.
 *
 * Os componentes originais continuam disponiveis para importacao direta
 * quando o lazy loading nao for desejado.
 */

/** Grafico de linhas (Evolucao de Receita) */
export const LazyLineChartCard = dynamic(
  () => import("./LineChartCard").then((m) => m.LineChartCard),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={240} variant="line" />,
  },
);

/** Grafico de area (Crescimento de Seguidores) */
export const LazyAreaChartCard = dynamic(
  () => import("./AreaChartCard").then((m) => m.AreaChartCard),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={240} variant="area" />,
  },
);

/** Grafico de barras (Engagement Mensal) */
export const LazyBarChartCard = dynamic(
  () => import("./BarChartCard").then((m) => m.BarChartCard),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={240} variant="bar" />,
  },
);

/** Grafico de barras comparativo (Comparativo entre Unidades) */
export const LazyComparisonBarChart = dynamic(
  () => import("./ComparisonBarChart").then((m) => m.ComparisonBarChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={280} variant="bar" />,
  },
);

/** Grafico de radar comparativo (Perfil Comparativo) */
export const LazyComparisonRadarChart = dynamic(
  () => import("./ComparisonRadarChart").then((m) => m.ComparisonRadarChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={320} variant="line" />,
  },
);

/** Grafico de pizza/donut (Distribuicao por Plataforma) */
export const LazyPlatformDonutChart = dynamic(
  () => import("./PlatformDonutChart").then((m) => m.PlatformDonutChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={280} variant="line" />,
  },
);

/** Grafico de barras empilhadas (Composicao Empilhada) */
export const LazyPlatformStackedBarChart = dynamic(
  () => import("./PlatformStackedBarChart").then((m) => m.PlatformStackedBarChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={200} variant="bar" />,
  },
);
