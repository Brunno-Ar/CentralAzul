# Plano de Ação Passo a Passo: Correção de Performance Crítica

> **Ordem de execução obrigatória** - Cada step depende do anterior.
> **Modo:** Executar no modo **CODE** após revisão.

---

## Checklist de Execução

### FASE 1: Preparação e Backup (5 min)

- [ ] **Step 1.1** - Commit atual: `git add -A && git commit -m "checkpoint: pre-performance-fix"`
- [ ] **Step 1.2** - Criar branch: `git checkout -b fix/performance-critical`
- [ ] **Step 1.3** - Verificar Node/Next versão: `node -v && npx next --version` (esperado: Next 16.2.9)

---

### FASE 2: Correção do Auth - JWT Stateless (CRÍTICO - 30 min)

- [ ] **Step 2.1** - Editar `src/auth.config.ts`: adicionar `maxAge` e `updateAge` no session + jwt config
- [ ] **Step 2.2** - Editar `src/auth.ts`:
  - Remover bloco `if (token.email) { const dbUser = await dbSim.getUserByEmail... }` (linhas 80-89)
  - Manter apenas sincronização inicial (`if (user) { token.id = ... }`) e `trigger === "update"`
  - Adicionar callback `async redirect()` se necessário para pós-login
- [ ] **Step 2.3** - Criar `src/app/api/auth/refresh-role/route.ts`:
  ```typescript
  // POST /api/auth/refresh-role
  // Body: { userId: string }
  // Action: busca user no DB, gera novo JWT com role atualizado, seta cookie
  ```
- [ ] **Step 2.4** - Editar `src/app/api/users/route.ts` (PUT): após `dbSim.updateUserHierarchy`, chamar `fetch('/api/auth/refresh-role', { method: 'POST', body: JSON.stringify({ userId }) })`
- [ ] **Step 2.5** - Testar: login → dashboard → alterar role via UI → verificar se session reflete sem reload manual

---

### FASE 3: Migração Middleware → Proxy (10 min)

- [ ] **Step 3.1** - Renomear `src/middleware.ts` → `src/proxy.ts`
- [ ] **Step 3.2** - Ajustar import em `src/auth.ts` se houver referência cruzada
- [ ] **Step 3.3** - Verificar `next.config.ts` não tem config `middleware:` antiga
- [ ] **Step 3.4** - Rodar `npm run dev` e confirmar: **warning "middleware deprecated" desapareceu**

---

### FASE 4: Otimização AuroraBackground (15 min)

- [ ] **Step 4.1** - Editar `src/components/ui/aurora-background.tsx`:
  - Remover classes: `filter blur-[10px]`, `invert-0`, `mix-blend-difference`, `background-attachment:fixed`, pseudo-element `after:...`
  - Substituir `animate-aurora` por `animate-aurora-slow`
  - Adicionar `transform-gpu` (ou `transform translateZ(0)`) no container
- [ ] **Step 4.2** - Editar `src/app/globals.css`:
  - Adicionar `@keyframes aurora-slow` (20s ease-in-out infinite)
  - Adicionar `.animate-aurora-slow { animation: aurora-slow 20s ease-in-out infinite; will-change: background-position; transform: translateZ(0); }`
- [ ] **Step 4.3** - Testar visual: `npm run dev` → página login → verificar animação suave, sem travamento, 60fps (DevTools Performance)

---

### FASE 5: SessionProvider Único + Layout (5 min)

- [ ] **Step 5.1** - Editar `src/app/dashboard/layout.tsx`: remover `<SessionProvider>` wrapper (linhas 1, 10, 25)
- [ ] **Step 5.2** - Manter apenas `DashboardNav` e structure de layout
- [ ] **Step 5.3** - Verificar se `src/app/layout.tsx` mantém `<SessionProvider>` na raiz

---

### FASE 6: Filesystem - Relocalizar `.next` (10 min)

- [ ] **Step 6.1** - Editar `next.config.ts`:
  ```typescript
  const nextConfig: NextConfig = {
    distDir:
      process.env.NODE_ENV === "development"
        ? "C:/tmp/central-azul-next"
        : ".next",
  };
  ```
- [ ] **Step 6.2** - Criar pasta destino: `mkdir C:/tmp/central-azul-next` (PowerShell Admin)
- [ ] **Step 6.3** - Limpar cache antigo: `Remove-Item -Recurse -Force .next` (se existir)
- [ ] **Step 6.4** - Rodar `npm run dev` e confirmar: **warning "Slow filesystem detected" desapareceu**

---

### FASE 7: Validação Completa (15 min)

- [ ] **Step 7.1** - Cold start: `npm run dev` → abrir `http://localhost:3000` → medir tempo até "Ready in Xms" no terminal
- [ ] **Step 7.2** - Navegar: `/` → login → `/dashboard` → `/dashboard/documentos` → `/dashboard/seguranca`
- [ ] **Step 7.3** - Verificar terminal output para cada request:
  - `GET /` **< 2000ms** (next.js < 1500ms)
  - `GET /api/auth/session` **< 100ms** (application-code < 50ms)
  - `GET /dashboard` **< 200ms**
  - `GET /api/users` **< 200ms**
- [ ] **Step 7.4** - Testar fluxo auth completo:
  - Login com credenciais demo
  - Logout
  - Login Microsoft Entra ID (se configurado)
  - Role switch via UI (admin) → verificar session update
- [ ] **Step 7.5** - Build produção: `npm run build` → verificar sem erros
- [ ] **Step 7.6** - Lighthouse (opcional): `npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json` → LCP < 2.5s

---

### FASE 8: Commit e Merge (5 min)

- [ ] **Step 8.1** - `git add -A && git commit -m "perf: critical fixes - JWT stateless, proxy middleware, optimized aurora, single SessionProvider, local .next"`
- [ ] **Step 8.2** - `git checkout main && git merge fix/performance-critical`
- [ ] **Step 8.3** - Tag: `git tag -a v0.1.1-perf -m "Performance critical fixes"`

---

## Comandos de Verificação Rápida (Copy-Paste)

```powershell
# 1. Verificar versões
node -v; npx next --version

# 2. Dev server com timing
npm run dev

# 3. Build produção
npm run build

# 4. Limpar cache Next.js se necessário
Remove-Item -Recurse -Force .next, node_modules/.cache -ErrorAction SilentlyContinue

# 5. Verificar arquivos modificados
git status
git diff src/auth.ts
git diff src/auth.config.ts
git diff src/components/ui/aurora-background.tsx
git diff next.config.ts
```

---

## Rollback Rápido (se algo quebrar)

```powershell
# Voltar ao checkpoint
git checkout main
git branch -D fix/performance-critical

# Ou reset hard para commit anterior
git reset --hard HEAD~1
```

---

## Critérios de Aceitação (Definition of Done)

| Critério                | Como Verificar                                | Status |
| ----------------------- | --------------------------------------------- | ------ |
| Cold start < 2s         | Terminal "Ready in Xms" + browser network tab | [ ]    |
| Auth session < 100ms    | Terminal `GET /api/auth/session` timing       | [ ]    |
| Zero middleware warning | Terminal output limpo                         | [ ]    |
| Zero filesystem warning | Terminal output limpo                         | [ ]    |
| Aurora 60fps suave      | DevTools Performance tab / visual             | [ ]    |
| Role change reflete     | UI atualiza sem reload manual                 | [ ]    |
| Build passa             | `npm run build` exit code 0                   | [ ]    |
| LCP < 2.5s              | Lighthouse report                             | [ ]    |

---

## Estimativa Total: ~90 minutos

**Prioridade de execução:** FASE 2 → FASE 3 → FASE 6 → FASE 4 → FASE 5 → FASE 7 → FASE 8

> **Nota:** FASE 2 (Auth) e FASE 6 (Filesystem) são as de maior impacto. Executar primeiro.
