"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartErrorBoundary } from "./ChartErrorBoundary";

/**
 * Wrappers de lazy loading para todos os componentes de grafico do dashboard.
 *
 * Usa next/dynamic para code-splitar cada grafico em seu proprio chunk,
 * reduzindo o JavaScript inicial da pagina e melhorando o tempo de
 * primeira exibicao (TTV). Cada wrapper inclui:
 * - Skeleton proprio durante o carregamento
 * - ErrorBoundary que captura falhas de renderizacao sem derrubar a pagina
 *
 * Os componentes originais continuam disponiveis para importacao direta
 * quando o lazy loading nao for desejado.
 */

/** Grafico de linhas (Evolucao de Receita) */
const _LazyLineChartCard = dynamic(
  () => import("./LineChartCard").then((m) => m.LineChartCard),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={240} variant="line" />,
  },
);

/** Grafico de area (Crescimento de Seguidores) */
const _LazyAreaChartCard = dynamic(
  () => import("./AreaChartCard").then((m) => m.AreaChartCard),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={240} variant="area" />,
  },
);

/** Grafico de barras (Engagement Mensal) */
const _LazyBarChartCard = dynamic(
  () => import("./BarChartCard").then((m) => m.BarChartCard),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={240} variant="bar" />,
  },
);

/** Grafico de barras comparativo (Comparativo entre Unidades) */
const _LazyComparisonBarChart = dynamic(
  () => import("./ComparisonBarChart").then((m) => m.ComparisonBarChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={280} variant="bar" />,
  },
);

/** Grafico de radar comparativo (Perfil Comparativo) */
const _LazyComparisonRadarChart = dynamic(
  () => import("./ComparisonRadarChart").then((m) => m.ComparisonRadarChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={320} variant="line" />,
  },
);

/** Grafico de pizza/donut (Distribuicao por Plataforma) */
const _LazyPlatformDonutChart = dynamic(
  () => import("./PlatformDonutChart").then((m) => m.PlatformDonutChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={280} variant="line" />,
  },
);

/** Grafico de barras empilhadas (Composicao Empilhada) */
const _LazyPlatformStackedBarChart = dynamic(
  () => import("./PlatformStackedBarChart").then((m) => m.PlatformStackedBarChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={200} variant="bar" />,
  },
);

/** Wrappers publicos que envolvem cada grafico com ErrorBoundary */
export function LazyLineChartCard(props: React.ComponentProps<typeof _LazyLineChartCard>) {
  return (
    <ChartErrorBoundary chartName="Evolucao de Receita" height={props.height ?? 240}>
      <_LazyLineChartCard {...props} />
    </ChartErrorBoundary>
  );
}

export function LazyAreaChartCard(props: React.ComponentProps<typeof _LazyAreaChartCard>) {
  return (
    <ChartErrorBoundary chartName="Crescimento de Seguidores" height={props.height ?? 240}>
      <_LazyAreaChartCard {...props} />
    </ChartErrorBoundary>
  );
}

export function LazyBarChartCard(props: React.ComponentProps<typeof _LazyBarChartCard>) {
  return (
    <ChartErrorBoundary chartName="Engagement Mensal" height={props.height ?? 240}>
      <_LazyBarChartCard {...props} />
    </ChartErrorBoundary>
  );
}

export function LazyComparisonBarChart(props: React.ComponentProps<typeof _LazyComparisonBarChart>) {
  return (
    <ChartErrorBoundary chartName="Comparativo de Barras" height={props.height ?? 280}>
      <_LazyComparisonBarChart {...props} />
    </ChartErrorBoundary>
  );
}

export function LazyComparisonRadarChart(props: React.ComponentProps<typeof _LazyComparisonRadarChart>) {
  return (
    <ChartErrorBoundary chartName="Perfil Comparativo" height={props.height ?? 320}>
      <_LazyComparisonRadarChart {...props} />
    </ChartErrorBoundary>
  );
}

export function LazyPlatformDonutChart(props: React.ComponentProps<typeof _LazyPlatformDonutChart>) {
  return (
    <ChartErrorBoundary chartName="Distribuicao por Plataforma" height={props.height ?? 280}>
      <_LazyPlatformDonutChart {...props} />
    </ChartErrorBoundary>
  );
}

export function LazyPlatformStackedBarChart(props: React.ComponentProps<typeof _LazyPlatformStackedBarChart>) {
  return (
    <ChartErrorBoundary chartName="Composicao Empilhada" height={props.height ?? 200}>
      <_LazyPlatformStackedBarChart {...props} />
    </ChartErrorBoundary>
  );
}
