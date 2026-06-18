# Especificação Técnica: Correção de Performance Crítica - Central Azul

> **Diagnóstico baseado no terminal output:** `GET / 200 in 15.5s (next.js: 15.1s)` + `Slow filesystem detected (327ms)` + `middleware deprecated warning`

---

## 1. Diagnóstico dos Problemas Críticos

### 1.1 Carregamento Inicial Excessivo (15.5s → meta < 2s)

| Componente                    | Tempo Atual | Causa Raiz                                                                                                                                                           |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js compilation**       | 15.1s       | `AuroraBackground` com CSS `animate-aurora` + `filter blur-[10px]` + `background-attachment: fixed` + `mix-blend-difference` força repaint/GPU pesado no first paint |
| **Middleware**                | 131ms       | Arquivo `middleware.ts` usa convenção **depreciada** (Next.js 15+), executa em _edge runtime_ frio a cada request                                                    |
| **Auth Session (1ª chamada)** | 1.8s        | Callback `jwt` em `auth.ts:80-89` faz **query síncrona ao banco a cada validação de token** (N+1 problem)                                                            |

### 1.2 Filesystem Lento (327ms benchmark)

```
⚠ Slow filesystem detected. The benchmark took 327ms.
If D:\IMPORTANTE\Grupo Azul\CentralAzul\.next/dev is a network drive, consider moving it to a local folder.
```

**Causa:** Pasta `.next` residindo em unidade de rede (D: mapeado) ou HDD mecânico. Turbopack precisa de I/O rápido.

### 1.3 Arquitetura de Auth Problemática

```typescript
// src/auth.ts:80-89 - EXECUTA A CADA REQUEST DE SESSION
if (token.email) {
  const dbUser = await dbSim.getUserByEmail(token.email as string); // QUERY DB
  if (dbUser) {
    token.role = dbUser.role; // sobrescreve token
    // ...
  }
}
```

**Problemas:**

- Query síncrona ao banco a **cada validação de sessão** (middleware + API routes + client `useSession`)
- `dbSim.getUserByEmail` tenta Prisma → fallback → mock array `find()` → **O(n) linear**
- Invalida cache de JWT nativo do NextAuth v5
- Race condition: se role muda no DB, token JWT _antigo_ ainda válido até expiração

### 1.4 Middleware Depreciado

```typescript
// src/middleware.ts:5 - DEPRECATED em Next.js 15+
const { auth } = NextAuth(authConfig);
export default auth((req) => { ... })
```

**Impacto:** Warning + execução em Edge Runtime sem cache + incompatibilidade futura.

### 1.5 SessionProvider Duplicado

```tsx
// src/app/layout.tsx:32 + src/app/dashboard/layout.tsx:10
<SessionProvider> // Root
<SessionProvider> // Dashboard (nested)
```

**Impacto:** Duas instâncias de contexto React, re-renders desnecessários, hydration mismatch risco.

---

## 2. Especificação das Correções

### 2.1 Correção do Auth (Prioridade CRÍTICA)

#### Estratégia: **Stateless JWT com Refresh Controlado**

```mermaid
flowchart TD
    A[Login Credentials] --> B[Authorize: busca user no DB 1x]
    B --> C[Gera JWT com: id, role, hierarchyLevel, company, status, iat, exp]
    C --> D[Middleware lê JWT do cookie - SEM query DB]
    D --> E[API Routes leem JWT via getToken() - SEM query DB]
    E --> F[Client useSession() lê do cookie - SEM query DB]
    F --> G[Role Change UI?]
    G -->|Sim| H[Trigger update session via API /api/auth/update-role]
    H --> I[Revalida JWT com novo role + rotação de token]
    I --> J[Middleware/API/Client veem novo role no próximo request]
    G -->|Não| K[JWT expira naturalmente em 24h / refresh 1h]
```

**Mudanças em `auth.ts`:**

- **Remover** callback `jwt` que faz query DB (linhas 80-89)
- **Adicionar** `maxAge` no JWT (24h) + `updateAge` (1h) para refresh silencioso
- **Criar** endpoint `/api/auth/refresh-role` para rotação forçada de token quando admin muda role

**Mudanças em `auth.config.ts`:**

```typescript
session: {
  strategy: "jwt",
  maxAge: 60 * 60 * 24, // 24h
  updateAge: 60 * 60,   // 1h refresh silencioso
},
jwt: {
  maxAge: 60 * 60 * 24,
},
```

### 2.2 Migração Middleware → Proxy (Next.js 15+)

**Arquivo novo:** `src/middleware.ts` → **renomear para** `src/proxy.ts` (convenção App Router)

```typescript
// src/proxy.ts
import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
```

**Atualizar `next.config.ts`:**

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    // proxy middleware já é padrão no Next 15+
  },
};
```

### 2.3 Otimização AuroraBackground (GPU/Render)

**Problema:** `filter blur-[10px]` + `background-attachment: fixed` + `mix-blend-difference` + `animate-aurora` animation = **layout thrashing + GPU memory pressure**

**Solução:** Simplificar para CSS-only sem blur pesado, usar `transform-gpu` class.

```tsx
// src/components/ui/aurora-background.tsx - VERSÃO OTIMIZADA
<div
  className={cn(
    "relative flex flex-col h-[100vh] items-center justify-center bg-brand-principal text-brand-secundar transition-bg overflow-hidden",
    "bg-[repeating-linear-gradient(100deg,var(--brand-secundar)_10%,var(--brand-extra3)_15%,var(--brand-secundar)_20%,var(--brand-extra1)_25%,var(--brand-extra3)_30%)]",
    "bg-[size:300%_200%] bg-[position:50%_50%]",
    "animate-aurora-slow", // nova keyframe suave 20s
    className,
  )}
>
  {/* Remover: blur, invert, mix-blend-difference, background-attachment:fixed, pseudo-element after */}
  {children}
</div>
```

**CSS Global (`globals.css`):**

```css
@keyframes aurora-slow {
  0% {
    background-position: 50% 50%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 50% 50%;
  }
}

.animate-aurora-slow {
  animation: aurora-slow 20s ease-in-out infinite;
  will-change: background-position;
  transform: translateZ(0); /* hardware accel */
}
```

### 2.4 Correção Filesystem (`.next` location)

**Opção A (Recomendada):** Mover `.next` para SSD local via `next.config.ts`

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  distDir:
    process.env.NODE_ENV === "development"
      ? "C:/tmp/central-azul-next" // SSD local
      : ".next",
};
```

**Opção B:** Symlink `D:\IMPORTANTE\Grupo Azul\CentralAzul\.next` → `C:\tmp\central-azul-next`

### 2.5 SessionProvider Único

```tsx
// src/app/layout.tsx - MANTER
// src/app/dashboard/layout.tsx - REMOVER SessionProvider wrapper
```

---

## 3. Trade-offs das Decisões

| Decisão                                      | Prós                                                       | Contras/Riscos                                                               | Mitigação                                                                |
| -------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **JWT Stateless (sem DB query por request)** | Latência ~1ms vs 150ms; escala horizontal; zero load no DB | Role change não reflete instantaneamente (até 1h refresh ou rotação forçada) | Endpoint `/api/auth/refresh-role` chamado após PUT `/api/users/:id/role` |
| **Middleware → Proxy**                       | Compatível Next 15+; remove warning; melhor cache          | Requer Next.js 15.2+ (já usando 16.2.9)                                      | Nenhum - já compatível                                                   |
| **AuroraBackground simplificado**            | First paint < 200ms; sem GPU thrashing; 60fps garantido    | Perde efeito visual "glassmorphism" complexo                                 | Manter gradient animado suave (brand-compliant)                          |
| **SessionProvider único**                    | Elimina double-render; hydration safe                      | Dashboard layout perde provider próprio (já herda do root)                   | Nenhum - herança natural do React Context                                |

---

## 4. Impacto no Banco de Dados

| Operação                              | Antes                                     | Depois                                             | Delta                     |
| ------------------------------------- | ----------------------------------------- | -------------------------------------------------- | ------------------------- |
| `GET /api/auth/session` (por request) | 1 query `SELECT * FROM users WHERE email` | 0 queries (JWT decode only)                        | **-100% queries**         |
| `Middleware` execução                 | 1 query via `auth()` callback             | 0 queries (JWT no cookie)                          | **-100% queries**         |
| Role change admin                     | N/A (quebrava token antigo)               | 1 `UPDATE users` + 1 POST `/api/auth/refresh-role` | **+1 write + 1 API call** |

**Estimativa:** Redução de ~500-1000 queries/min em produção moderada.

---

## 5. Plano de Contingência (Rollback)

Se houver regressão:

1. **Git revert** para commit anterior ao PR
2. **Feature flag** via env var: `NEXT_PUBLIC_AUTH_LEGACY=true` mantém callback DB temporariamente
3. **Monitoramento:** Log `console.time('auth-jwt')` vs `console.time('auth-db')` em `auth.ts`

---

## 6. Validação de Sucesso (Métricas)

| Métrica                      | Baseline | Target      | Ferramenta                                              |
| ---------------------------- | -------- | ----------- | ------------------------------------------------------- |
| `GET /` (cold start)         | 15.5s    | **< 2.0s**  | `npm run dev` + browser devtools                        |
| `GET /api/auth/session` (1ª) | 1.8s     | **< 100ms** | Terminal output                                         |
| Filesystem benchmark         | 327ms    | **< 50ms**  | Terminal warning desaparece                             |
| Middleware warning           | Presente | **Ausente** | Terminal output                                         |
| LCP (Lighthouse)             | ~8s      | **< 2.5s**  | `npm run build && npx lighthouse http://localhost:3000` |

---

## 7. Arquivos Afetados

| Arquivo                                   | Tipo Mudança                                    | Risco                            |
| ----------------------------------------- | ----------------------------------------------- | -------------------------------- |
| `src/auth.ts`                             | **Refatoração maior** (remover DB query do JWT) | Alto - testar auth flow completo |
| `src/auth.config.ts`                      | Configuração JWT timing                         | Baixo                            |
| `src/middleware.ts` → `src/proxy.ts`      | Renomear + ajustar export                       | Médio - convenção Next.js        |
| `src/app/layout.tsx`                      | Remover SessionProvider duplicado               | Baixo                            |
| `src/app/dashboard/layout.tsx`            | Remover SessionProvider                         | Baixo                            |
| `src/components/ui/aurora-background.tsx` | Simplificar CSS/animation                       | Baixo - visual only              |
| `src/app/globals.css`                     | Adicionar keyframe otimizada                    | Baixo                            |
| `next.config.ts`                          | Configurar `distDir` + experimental             | Baixo                            |

---

## 8. Próximos Passos (para modo CODE)

Ver `PLANO_ACAO_PERFORMANCE.md` para step-by-step sequencial.
