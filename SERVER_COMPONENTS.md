# Padrao de Server Components - Central Azul

> Documento de referencia para arquitetura de paginas do projeto Central Azul.
> Aplicavel a todas as paginas sob `src/app/dashboard/`.

---

## 1. Filosofia

O Next.js App Router executa componentes como Server Components por padrao. A regra geral e:

- **Server Component (SC)**: padrao para paginas, layouts e componentes que nao precisam de interatividade.
- **Client Component (CC)**: apenas para partes da UI que necessitam de estado, efeitos ou APIs do browser.

Isso reduz o JavaScript enviado ao cliente, melhora o FCP (First Contentful Paint) e simplifica o carregamento inicial de dados.

---

## 2. Estrutura de Arquivos por Pagina

Cada pagina deve seguir a seguinte convencao de arquivos:

```
app/dashboard/<nome-da-pagina>/
  page.tsx              # Server Component (SC) - entrada da pagina
  <Nome>Client.tsx      # Client Component (CC) - interatividade
  actions.ts            # Server Actions (opcional) - mutacoes
  hooks.ts              # Custom hooks (opcional) - logica reutilizavel
  loading.tsx           # UI de carregamento (Next.js)
  error.tsx             # UI de erro (Next.js)
```

### 2.1. page.tsx (Server Component)

- Deve ser `async` quando buscar dados.
- Nao usar `"use client"`.
- Buscar dados diretamente via `db`, `auth()` ou outras APIs server-only.
- Passar dados serializados para o Client Component via props.

```tsx
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Company } from "@prisma/client";
import FerramentasClient from "./FerramentasClient";

export default async function FerramentasPage() {
  const session = await auth();
  const user = session?.user as { hierarchyLevel?: number; role?: string } | undefined;
  const userLevel = user?.hierarchyLevel || 3;

  // Busca dados no servidor
  const [panels, companies, businessUnits] = await Promise.all([
    db.getPanels().catch(() => []),
    db.getCompanies().catch(() => []),
    db.getBusinessUnits().catch(() => []),
  ]);

  // Serializa dados para o cliente
  const serializedPanels = panels.map((p) => ({
    ...p,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
  }));

  return (
    <FerramentasClient
      initialPanels={serializedPanels}
      companies={companies}
      businessUnits={businessUnits}
      userLevel={userLevel}
    />
  );
}
```

### 2.2. <Nome>Client.tsx (Client Component)

- Deve ter `"use client"` no topo.
- Recebe dados iniciais via props (não busca na montagem).
- Contem estado local para interatividade (filtros, modais, formularios).
- Usa `useState` e event handlers para UI interativa.
- Nao usa `useEffect` para carregamento inicial de dados.

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FerramentasClientProps {
  initialPanels: Panel[];
  companies: Company[];
  businessUnits: BusinessUnit[];
  userLevel: number;
}

export default function FerramentasClient({
  initialPanels,
  companies,
  businessUnits,
  userLevel,
}: FerramentasClientProps) {
  const [panels, setPanels] = useState(initialPanels);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  // ... logica de filtro, modais, handlers

  return (
    // ... JSX
  );
}
```

### 2.3. actions.ts (Server Actions)

- Usado para mutacoes (create, update, delete).
- Deve ter `"use server"` no topo.
- Revalida cache com `revalidatePath` ou `revalidateTag`.

```tsx
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createPanel(data: CreatePanelInput) {
  // ... validacao
  await db.createPanel(data);
  revalidatePath("/dashboard/ferramentas");
}
```

### 2.4. hooks.ts (Custom Hooks)

- Extrair logica reutilizavel de Client Components.
- Nunca usar em Server Components.

```tsx
import { useState, useCallback } from "react";

export function useFilter<T>(items: T[], filterFn: (item: T, query: string) => boolean) {
  const [query, setQuery] = useState("");
  const filtered = query ? items.filter((item) => filterFn(item, query)) : items;
  return { query, setQuery, filtered };
}
```

---

## 3. Regras de Ouro

| Regra | Server Component | Client Component |
|-------|-----------------|------------------|
| Buscar dados | Sim (db, auth, fetch) | Nao (recebe via props) |
| Acessar browser APIs | Nao | Sim |
| Usar useState/useEffect | Nao | Sim |
| Usar event handlers | Nao | Sim |
| Importar modulos server-only | Sim | Nao |
| Renderizar filhos CC | Sim | Sim |
| Renderizar filhos SC | Sim | Nao (exceto via children) |

---

## 4. Anti-Padroes a Evitar

1. **useEffect para carregar dados iniciais**: Busque no SC e passe via props.
2. **"use client" em toda a pagina**: Isolar apenas a parte interativa.
3. **useState para dados que podem ser props**: Evitar duplicacao de estado.
4. **Chamadas fetch duplicadas**: Centralizar no SC.
5. **Logica de negocio no cliente**: Manter validacao e regras no servidor.

---

## 5. Exemplos no Projeto

### 5.1. Dashboard Home (Referencia)

- `page.tsx`: SC que busca logs, usuarios, paineis, documentos e unidades.
- `DashboardHomeClient.tsx`: CC que recebe props e renderiza UI com animacoes.

### 5.2. Comunicados (Referencia)

- `page.tsx`: SC que busca anuncios e leituras do usuario.
- `ComunicadosClient.tsx`: CC que gerencia estado de criacao/edicao/exclusao.

### 5.3. Documentos (Parcial - em migracao)

- `page.tsx`: Ja e SC, busca documentos no servidor.
- `DocumentosClient.tsx`: CC que gerencia upload e filtros.

---

## 6. Checklist de Migracao

- [ ] Transformar `page.tsx` em `async function` (remover `"use client"`).
- [ ] Mover busca de dados de `useEffect` para o SC.
- [ ] Criar/separar `<Nome>Client.tsx` com `"use client"`.
- [ ] Passar dados iniciais via props para o CC.
- [ ] Remover `useEffect` de carregamento inicial do CC.
- [ ] Verificar se `loading.tsx` e `error.tsx` existem.
- [ ] Testar compilacao (`next build`).
- [ ] Verificar se nao houve regressao funcional.

---

## 7. Convencoes de Nomenclatura

| Tipo | Convencao | Exemplo |
|------|-----------|---------|
| Pagina (SC) | `page.tsx` | `app/dashboard/ferramentas/page.tsx` |
| Client Component | `<Nome>Client.tsx` | `FerramentasClient.tsx` |
| Server Action | `actions.ts` | `app/dashboard/ferramentas/actions.ts` |
| Custom Hook | `use<Nome>.ts` | `useFilter.ts` ou `hooks.ts` |
| Loading UI | `loading.tsx` | Next.js convencao |
| Error UI | `error.tsx` | Next.js convencao |

---

*Documento criado no contexto do Bloco 2.1 - Definicao do Padrao de Server Components.*
