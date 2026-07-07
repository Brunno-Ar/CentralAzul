# Fundacao CentralAzul - Design Spec

**Data:** 2026-07-06
**Autor:** Bruno Araujo (com assistencia ZCode)
**Branch alvo:** criar `refactor/fundacao` a partir de `master` (sub-branches B1, B2, B3)
**Itens do plano atendidos:** #1, #2, #4, #20, #21, #22, #27
**Itens explicitamente fora do escopo (ficam para sub-projetos futuros):** #3 (migracao de paginas), #5 (transaction Tool->Panel), #6 (integracao analytics real), #7-#19 (features novas), #23-#26 (UX polishment), #28 (sitemap/robots)

## Contexto e Motivacao

O `src/lib/db.ts` tem 3499 linhas com cerca de 60 funcoes, misturando acesso Prisma, fallback mock e 3000+ linhas de mock data inline. Models do Prisma para `MenuPermission` e `LevelConfig` nao existem - operado apenas em memoria (perde-se a cada restart). Nao ha componentes UI reutilizaveis para Toast, Dialog e Skeleton - cada pagina duplica overlays e `animate-pulse` a mao. Nao ha health check para monitoramento externo.

A Fundacao resolve esses problemas para desbloquear migracoes de paginas e features novas com base solida.

## Escopo em 3 Branches Sequenciais

### B1: `refactor/db-modular` - Data Layer Modular (itens #1 + #2)

**Objetivo:** Quebrar `src/lib/db.ts` em modulos por dominio sem quebrar imports existentes. Extrair mock data para arquivos separados. Fallback mock so em dev.

**Estrutura final `src/lib/db/`:**

```
src/lib/db/
  index.ts              # reexporta db, prisma, isDatabaseConnected, Database
  client.ts              # prismaClient singleton + isDbConnected + isDev()
  types.ts               # Mock* interfaces migradas de db.ts
  fallback.ts            # helper tryPrisma()
  mock/
    users.ts
    companies.ts
    roles.ts
    panels.ts
    documents.ts
    announcements.ts
    business-units.ts    # BU + tools + social + analytics + metadata + revenue
    audit-logs.ts
    system-config.ts
    index.ts             # reexporta todos os arrays (HMR-safe via globalThis)
  users.ts
  roles.ts
  panels.ts
  documents.ts
  announcements.ts
  audit-logs.ts
  business-units.ts
  bu-tools.ts
  bu-social.ts
  bu-analytics.ts
  bu-metadata.ts
  bu-revenue.ts
  companies.ts
  sync.ts
  system-config.ts       # getSystemConfig, isMfaEnabled, getUserMfa, setUserMfa
  account-lockout.ts
  menu-permissions.ts    # mock em B1, migrado para Prisma em B3
  levels.ts              # mock em B1, migrado para Prisma em B3
```

**`src/lib/db.ts`** vira faixada fina (~30 linhas) reexportando de `./db/index`. Zero breaking changes para os ~50 imports existentes (`import { db } from '@/lib/db'` continua funcionando).

**Helper `tryPrisma` em `fallback.ts`:**

```ts
export async function tryPrisma<T>(
  op: () => Promise<T>,
  mockFallback: () => T,
  mockName: string
): Promise<T> {
  if (isDbConnected) {
    try {
      return await op();
    } catch (e) {
      if (process.env.NODE_ENV === 'production') throw e;
      console.warn(`[db] Prisma falhou em ${mockName}, caindo no mock (dev)`, e);
    }
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`DB indisponivel e fallback mock desativado em producao: ${mockName}`);
  }
  return mockFallback();
}
```

**Ordem de commits (cada commit compila e passa testes):**

1. Criar estrutura de pastas + `types.ts` + `client.ts` + `fallback.ts` (db.ts ainda funciona)
2. Migrar mock arrays para `mock/*.ts` (db.ts importa deles)
3. Migrar `users.ts` + `roles.ts` + `panels.ts`
4. Migrar `documents.ts` + `announcements.ts` + `audit-logs.ts` + `companies.ts`
5. Migrar `business-units.ts` + `bu-*.ts` + `sync.ts`
6. Migrar `system-config.ts` + `account-lockout.ts` + `menu-permissions.ts` + `levels.ts`
7. Converter `db.ts` em faixada fina + atualizar `index.ts`
8. Adicionar testes de superficie em `src/__tests__/db.test.ts`

**Testes:** `vitest` (suite + novos testes de superficie) e `npx playwright test` (e2e) devem passar sem alteracao de callers. Novos testes cobrem `db.getUsers`, `db.getRoles`, `db.getPanels` com Prisma conectado e mock fallback em dev.

---

### B2: `refactor/ui-primitives` - shadcn/ui + Toast + Dialog + Skeleton (itens #20, #21, #22)

**Objetivo:** Adotar shadcn/ui com design tokens da paleta AGENTS.md. Integrar Sonner para toasts. Adicionar Skeleton e AlertDialog reutilizaveis. Substituir padroes duplicados nas paginas ja migradas (Comunicados, Documentos, Dashboard home).

**Setup shadcn/ui (Tailwind v4):**

- `npx shadcn@latest init` - style "default", base color neutral, CSS variables yes, dir `src/components/ui/`, util `src/lib/utils.ts` (`cn()`), `components.json`
- Design tokens em `src/app/globals.css` mapeando paleta AGENTS.md para variaveis CSS do shadcn:
  - `--background: #E9E9E9` / `--foreground: #262626`
  - `--primary: #105D8F` / `--primary-foreground: #E9E9E9`
  - `--accent: #CC9F6F` / `--muted-foreground: #604F45`
  - `--card: #FFFFFF` / border neutro
  - dark mode com paleta invertida quando aplicavel
- Componentes via CLI: `sonner`, `dialog`, `alert-dialog`, `skeleton`, `dropdown-menu`, `select`, `switch`, `tabs`, `tooltip`

**Integracao Sonner (item #21):**

- `<Toaster richColors position="top-right" />` em `src/app/dashboard/layout.tsx`
- Helper `src/lib/toast.ts` com wrappers `toast.success/error/info/warning` em PT-BR, sem emojis (regra AGENTS.md)
- Substituir mensagens inline condicionais em `ComunicadosClient.tsx`, `DocumentosClient.tsx`, `DashboardHomeClient.tsx` por `toast.success(...)` em callbacks de mutacao. Nao tocar nas paginas nao migradas (ferramentas/seguranca/configuracoes/unidades) - mantem escopo.

**Skeleton (item #20):**

- Substituir `src/app/dashboard/loading.tsx` (hand-rolled `animate-pulse`) por `<Skeleton>` shadcn com shimmer
- Sub-rotas que fazem `export { default } from "../loading"` continuam funcionando automaticamente
- Manter comportamento mobile-first e tokens da paleta

**AlertDialog (item #22):**

- Wrapper `src/components/ui/confirm-dialog.tsx` sobre `AlertDialog` shadcn:
  ```ts
  type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    variant?: "default" | "destructive";
  };
  ```
- Substituir `confirm()` nativo em delecoes em `ComunicadosClient.tsx` e `DocumentosClient.tsx` (paginas ja migradas). Nao substituir nas paginas nao migradas - fica para a fase de migracao delas.

**Ordem de commits:**

1. `chore: init shadcn/ui + design tokens AGENTS.md`
2. `feat: add Sonner Toaster integration`
3. `feat: replace inline success/error messages with toasts`
4. `feat: add Skeleton component + replace dashboard loading.tsx`
5. `feat: add AlertDialog + ConfirmDialog wrapper`
6. `refactor: replace native confirm() in migrated pages`

**Testes:** Playwright e2e deve continuar passando (toasts/displays nao afetam fluxo funcional). Adicionar teste e2e de snapshot para `loading.tsx`.

---

### B3: `refactor/persist-config-health` - Prisma Models + Health Check (itens #4 + #27)

**Objetivo:** Persistir `MenuPermission` e `LevelConfig` no banco. Migrar funcoes db de mock para Prisma. Adicionar `/api/health` para monitoramento externo.

**Branch:** criado idealmente apos B1 mergeado (reduz conflitos em `src/lib/db/`). Pode ser paralelo desde que se reconcilie ao merge.

**Novos models Prisma:**

```prisma
model MenuPermission {
  id               Int      @id @default(autoincrement())
  key              String   @unique
  label            String
  visibleByDefault Boolean  @default(true)
  allowedLevels    String   // JSON serializado: "[1,2]" ou "all" - String (nao Json) por compatibilidade MariaDB/MySQL, parseado no application layer
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model LevelConfig {
  id             Int      @id @default(autoincrement())
  name           String   @unique
  hierarchyLevel Int       // 1=direcao, 2=gerencia, 3=operacional
  color          String?   // hex opcional para badge UI
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Migration:** `prisma/migrations/<timestamp>_add_menu_permission_level_config/migration.sql` via `npx prisma migrate dev --name add_menu_permission_level_config`.

**Seed inicial (`prisma/seed.ts`):** popular `MenuPermission` com chaves/labels das mock arrays atuais e `LevelConfig` com VIEWER + Direcao Geral + Gerencia + Operacional. Idempotente (`upsert` por `key`/`name`). Adicionar script `db:seed` ao `package.json`.

**Migracao da camada db:**

- `src/lib/db/menu-permissions.ts`: substituir mock por `prisma.menuPermission.findMany()/update()/upsert()`. Adicionar `createMenuPermission` e `deleteMenuPermission` (hoje so existe `update`).
- `src/lib/db/levels.ts`: substituir mock por `prisma.levelConfig.findMany()/create()/update()/delete()`. Adicionar `updateLevel` que faltava.
- Em producao: erro de DB = erro 500, sem mock silencioso (ja garantido por `tryPrisma` do B1).

**Rotas de API:**

- `src/app/api/menu-permissions/route.ts`: GET e PUT continuam checando `hierarchyLevel === 1`. Dados agora vem do Prisma. Adicionar POST e DELETE com mesma protecao.
- `src/app/api/levels/route.ts`: idem. Adicionar POST e DELETE.

**Health check (item #27) - `src/app/api/health/route.ts`:**

```ts
// GET /api/health -> 200 JSON:
{
  "status": "ok" | "degraded" | "down",
  "checks": {
    "database": { "status": "up"|"down", "latencyMs": number },
    "storage":  { "status": "up"|"down", "provider": "Armazenamento local" },
    "auth":     { "status": "up"|"down", "provider": "nextauth" }
  },
  "timestamp": "<ISO8601>",
  "version": "<package.json version>"
}
```

- DB: `prisma.$queryRaw\`SELECT 1\`` com `performance.now()`
- Storage: HEAD no bucket via `src/lib/b2.ts` (nome ocultado na resposta - nunca "B2"/"Backblaze"/"S3")
- Auth: checa `AUTH_SECRET` env + NextAuth config carregada. Sem expor credenciais.
- Sem autenticacao exigida (publico para UptimeRobot), com rate limit via `src/lib/rate-limit.ts` existente.

**Ordem de commits:**

1. `feat: add MenuPermission and LevelConfig Prisma models + migration`
2. `feat: add seed for MenuPermission and LevelConfig`
3. `refactor: persist getMenuPermissions/create/update/delete via Prisma`
4. `refactor: persist getLevels/create/update/delete via Prisma`
5. `feat: add /api/health endpoint`
6. `test: add health endpoint e2e`

**Testes:** Playwright e2e do `/api/health` retorna 200 e shape esperado. Teste manual de persistencia: alterar permission via PUT, restartar dev server, recarregar, ver que persiste.

## Principios Transversais

- **Sem emojis, sem travessoes longos, nomes de infra interna (Backblaze/B2/S3) ocultos** - regras AGENTS.md aplicadas em todos componentes novos e strings (uso de "Armazenamento local" / "Drive de Arquivos" no lugar).
- **Paleta AGENTS.md** (#E9E9E9, #105D8F, #262626, marrons #5C4C44/#604F45/#CC9F6F) como design tokens do shadcn em B2 - todos componentes seguem identidade visual automaticamente.
- **Mobile-first** mantido em todas alteracoes de UI.
- **Animacoes suaves** (transicoes ~0.2s, tween, nao mola instavel) e `transform-gpu` onde houver animacao de largura/posicionamento (regra AGENTS.md).
- **Nao retrofit:** B1 toca so `src/lib/db*`, B2 so `src/components/ui/*` + `src/app/dashboard/layout.tsx` + `loading.tsx` + paginas ja migradas (Comunicados/Documentos/Dashboard home), B3 so Prisma + 3 rotas de API. Nenhum branch mexe nos `*Client.tsx` das paginas nao migradas (isso fica para a fase de migracao de paginas, sub-projeto futuro).
- **Cada branch roda `vitest` (unit) e `playwright` (e2e) antes de merge.**

## Decisoes Registradas

| Decisao | Escolha | Justificativa |
|---|---|---|
| Escopo | Decompor plano 28 itens em sub-projetos | User pediu "blocos pequenos"; spec unica de 28 itens seria vaga |
| Sub-projeto 1 | Fundacao enxuta (#1,#2,#4,#20,#21,#22,#27) | Desbloqueia resto sem inflar escopo |
| Estrutura db | Modulos por dominio em `src/lib/db/` | Clear, escala bem, isola mock |
| Faixada `db.ts` | Mantida como reexport | Zero breaking changes nos ~50 imports |
| Fallback mock | So em dev (NODE_ENV=production = throw) | Nao mascara erros em producao, mantem resiliencia dev |
| UI primitives | shadcn/ui (CLI oficial) | Radix ja instalado, padronizado, comunidade mantem |
| Sequenciamento | 3 branches sequenciais B1->B2->B3 | Cada PR reviewavel e reversivel, honra "blocos pequenos" |
| #5 (transaction) | Fora do escopo | Toca codigo de business-units que sera migrado em #3 |
| #6 (analytics real) | Fora do escopo | Integracao OAuth (Meta/Google/YouTube) e projeto proprio |

## Fora do Escopo (sub-projetos futuros)

- **Migracao de paginas (#3):** `ferramentas`, `seguranca`, `configuracoes`, `unidades` para padrao Server -> Client. Spec propria.
- **Transaction Tool->Panel (#5):** Correcao cirurgica que toca business-units.
- **Analytics real APIs (#6):** OAuth com Meta Graph, Google Analytics, YouTube Data.
- **Features novas (#7-#19):** Notificacoes, dashboard metricas, kanban, preview docs, busca aprimorada, rich text, timeline, calendario, comparador, chat.
- **UX polishment (#23-#26):** Breadcrumbs, sidebar grupos, empty states, mobile responsive.
- **DevOps (#28):** sitemap/robots para SEO.
