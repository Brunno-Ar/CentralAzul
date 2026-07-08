# Modulo de Metricas (Dashboard)

Pagina `/dashboard/metricas` com KPIs, graficos, comparativos entre unidades e distribuicao por plataforma.

## Estrutura de Arquivos

```
src/
  app/dashboard/metricas/
    page.tsx               - Server Component: auth, geracao de mock data inicial
    metricas-client.tsx    - Client Component: orchestrador de filtros, KPIs e graficos
    loading.tsx            - Skeleton de carregamento da pagina

  components/metricas/
    MetricCard.tsx          - Card de KPI individual (icone, valor, indicador de cambio)
    KpiGrid.tsx             - Grid responsivo de 8 KPIs (2 cols mobile, 4 cols desktop)
    SectionCard.tsx          - Container de secao reutilizavel com titulo e icone
    FiltersBar.tsx           - Filtros globais (periodo, unidade, plataforma)
    use-metricas-filters.tsx - Context Provider para estado dos filtros
    ChartContainer.tsx       - Wrapper com Suspense + skeleton para graficos
    ChartSkeleton.tsx        - Skeleton animado para estados de loading
    ChartErrorBoundary.tsx   - ErrorBoundary que captura falhas de renderizacao de graficos
    EmptyState.tsx           - Estado vazio reutilizavel para secoes sem dados
    chart-theme.ts           - Paleta de cores centralizada para recharts
    LineChartCard.tsx        - Grafico de linhas (Evolucao de Receita)
    AreaChartCard.tsx        - Grafico de area (Crescimento de Seguidores)
    BarChartCard.tsx         - Grafico de barras (Engagement Mensal)
    ComparisonUnitSelector.tsx - Multi-seletor de unidades para comparativos
    ComparisonBarChart.tsx   - Grafico de barras comparativo entre unidades
    ComparisonRadarChart.tsx - Grafico de radar (spider) comparativo entre unidades
    PlatformDonutChart.tsx   - Grafico de pizza/donut (Distribuicao por Plataforma)
    PlatformStackedBarChart.tsx - Barra empilhada (Composicao por Plataforma)
    lazy-charts.tsx          - Wrappers next/dynamic com ErrorBoundary para lazy loading
    use-chart-height.ts      - Hook responsiva para alturas de grafico por viewport

  lib/mock/
    dashboard-metrics.ts     - Gerador de dados mock deterministicos (PRNG seeded)
```

## Blocos (Historico de Implementacao)

| Bloco | Branch | Escopo |
|-------|--------|--------|
| 5.1 | feature/dashboard-metrics-foundation | Rota, layout, grid, SectionCard, MetricCard, dados mock |
| 5.2 | feature/dashboard-kpis | 8 KPI cards com icone, valor, comparacao e indicador |
| 5.3 | feature/dashboard-filters | Filtros: periodo (7/30/90/365/custom), unidade, plataforma |
| 5.4 | feature/dashboard-charts | Graficos de linhas, area e barras com tooltip, legenda, animacao |
| 5.5 | feature/dashboard-comparison | Barras comparativas e radar entre unidades (multi-selecao) |
| 5.6 | feature/dashboard-platform-distribution | Pizza, donut e barras empilhadas por plataforma |
| 5.7 | feature/dashboard-performance | Lazy loading, skeletons, React.memo, hook responsiva, mobile |
| 5.8 | feature/dashboard-metrics-polish | Acessibilidade, estados vazios, ErrorBoundary, documentacao, testes |

## Arquitetura

### Fluxo de Dados

1. `page.tsx` (Server Component) chama `auth()` para obter o nivel de hierarquia do usuario
2. `generateDashboardMockData(DEFAULT_FILTERS)` gera dados deterministicos no servidor
3. `MetricasClient` recebe os dados e envolve em `MetricasFiltersProvider`
4. `MetricasClientContent` consome `useMetricasFilters()` e regenera dados via `useMemo` quando filtros mudam
5. Cada grafico recebe apenas os dados relevantes (serie temporal, metricas de unidade, distribuicao)

### Filtros Globais

O estado dos filtros vive em `MetricasFiltersContext` (Context API):
- `period`: 7, 30, 90, 365 ou "custom"
- `unit`: slug da unidade ou "all"
- `platform`: chave da plataforma ou "all"
- `customStartDate` / `customEndDate`: datas ISO quando period e "custom"

Todos os graficos respondem automaticamente aos filtros porque os dados mock sao regenerados com seed deterministica que varia com os filtros ativos.

### Dados Mock

O gerador `generateDashboardMockData` usa PRNG `mulberry32` com seed `hashSeed` (mesma abordagem de `db.ts` e `mock-provider.ts`). A seed varia com os filtros:

```
seed = hashSeed("dashboard-metricas-${period}-${unit}-${platform}-${customStart}-${customEnd}")
```

Isso garante:
- Valores consistentes entre renders e hot reloads
- Dados diferentes quando filtros mudam
- Determinismo para testes

### Lazy Loading e Performance

Todos os 7 graficos sao carregados sob demanda via `next/dynamic` em `lazy-charts.tsx`:
- `ssr: false` (graficos dependem de DOM/ResponsiveContainer)
- `ChartSkeleton` como fallback durante o carregamento
- Cada grafico envolvido por `ChartErrorBoundary` para isolamento de falhas

Componentes pesados usam `React.memo`:
- `ComparisonBarChart` (memoizada)
- `ComparisonRadarChart` (memoizada)
- `ComparisonRow` (memoizada)

O hook `useChartHeight(baseHeight)` reduz a altura dos graficos em viewports menores:
- Mobile (<640px): 60% da altura base (min 160px)
- Tablet (640-1024px): 80% da altura base
- Desktop: 100% da altura base

### Acessibilidade

- Skip-link no topo da pagina (`#metricas-conteudo`)
- `role="main"` e `aria-label` no container principal
- `aria-live="polite"` no subtitulo (anuncia mudancas de filtro)
- `aria-pressed` nos botoes de toggle de periodo e tipo de grafico
- `role="tablist"` / `role="tab"` / `aria-selected` nas tabs de metrica comparativa
- `role="listbox"` / `role="option"` / `aria-selected` no seletor de unidades
- `aria-label` nos selects e inputs de data
- `aria-hidden="true"` em icones decorativos
- `role="status"` + `aria-busy="true"` + `aria-live="polite"` nos skeletons
- `role="alert"` + `aria-live="assertive"` no ErrorBoundary
- `role="status"` no EmptyState

### Tratamento de Erros

3 camadas de protecao:

1. **PageWrapper ErrorBoundary**: captura erros fatais da pagina inteira (ja existente no projeto)
2. **ChartErrorBoundary**: envolve cada grafico individualmente, isolando falhas
3. **EmptyState**: exibido quando arrais de dados estao vazios (filtros sem resultados)

### Design Tokens e Paleta

As cores dos graficos sao definidas em `chart-theme.ts` usando os hex values das variaveis CSS do projeto:

| Token | Hex | Uso |
|-------|-----|-----|
| secundar | #105D8F | Cor principal de series |
| principal | #E9E9E9 | Fundo de skeletons |
| terciaria | #262626 | Texto de axis |
| extra1 | #5C4C44 | Valores destacados |
| extra2 | #604F45 | Variacao de serie |
| extra3 | #CC9F6F | Barras e destaque |

A paleta sequencial `CHART_PALETTE` (7 cores) intercala tonalidades da marca para multi-series.

## Testes

Os testes cobrem:
- PRNG deterministico (`mulberry32`, `hashSeed`)
- Geracao de dados mock (`generateDashboardMockData`)
- Estrutura dos KPIs (8 metricas com value, previousValue, change, changeLabel)
- Series temporais (quantidade de pontos varia com periodo)
- Metricas por unidade (filtragem por unidade selecionada)
- Distribuicao por plataforma (filtragem por plataforma selecionada)

Executar testes:
```bash
npx vitest run src/__tests__/dashboard-metrics.test.ts
```
