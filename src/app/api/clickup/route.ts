import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const CLICKUP_API = "https://api.clickup.com/api/v2";
const DEFAULT_TOKEN = "pk_118065939_GVKP5U0X3WGRK9QKG7J887T9S4PCUH81";
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos de cache em memória

// Cache global em memória no servidor
let memoryCache: {
  data: any;
  timestamp: number;
} | null = null;

interface ClickUpTag {
  name: string;
  tag_bg?: string;
  tag_fg?: string;
}

interface ClickUpAssignee {
  id: number | string;
  username?: string;
  email?: string;
  color?: string;
}

interface ClickUpTask {
  id: string;
  name: string;
  status?: {
    status?: string;
    type?: string;
  };
  due_date?: string | null;
  url?: string;
  list?: {
    id?: string;
    name?: string;
  };
  assignees?: ClickUpAssignee[];
  tags?: ClickUpTag[];
}

function classifyTask(task: ClickUpTask): "done" | "approved" | "late" | "scheduled" | "pending" {
  const type = task.status?.type?.toLowerCase() || "";
  const statusName = task.status?.status?.toLowerCase() || "";

  if (type === "closed" || type === "done") return "done";
  if (statusName.includes("aprov")) return "approved";

  const due = task.due_date ? parseInt(task.due_date, 10) : null;
  if (due && due < Date.now()) return "late";
  if (due && due >= Date.now()) return "scheduled";

  return "pending";
}

async function fetchTaskPage(teamId: string, page: number, headers: HeadersInit): Promise<{ tasks: ClickUpTask[]; lastPage: boolean }> {
  const url = new URL(`${CLICKUP_API}/team/${teamId}/task`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("include_closed", "true");
  url.searchParams.set("subtasks", "true");
  url.searchParams.set("order_by", "due_date");

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 180 }, // Next.js fetch cache (3 min)
  });

  if (!res.ok) {
    return { tasks: [], lastPage: true };
  }

  const data = await res.json();
  const tasks: ClickUpTask[] = data.tasks || [];
  const lastPage = Boolean(data.last_page || tasks.length < 100);

  return { tasks, lastPage };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("force") === "true";

    // Retorna cache em memória instantâneo se válido e não forçado
    if (!forceRefresh && memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(memoryCache.data, {
        headers: {
          "X-Cache": "HIT",
        },
      });
    }

    const token = process.env.CLICKUP_API_TOKEN || DEFAULT_TOKEN;
    const headers = { Authorization: token };

    // Fetch team info
    const teamRes = await fetch(`${CLICKUP_API}/team`, { headers, next: { revalidate: 300 } });
    if (!teamRes.ok) {
      const errBody = await teamRes.json().catch(() => ({}));
      throw new Error(errBody.err || `Erro HTTP ${teamRes.status} ao buscar workspace`);
    }

    const teamData = await teamRes.json();
    const teams = teamData.teams || [];
    if (!teams.length) {
      return NextResponse.json({ error: "Nenhum workspace encontrado no ClickUp" }, { status: 404 });
    }

    const teamId = teams[0].id;
    const teamName = teams[0].name;

    // Busca rápida da Página 0
    let allTasks: ClickUpTask[] = [];
    const page0Result = await fetchTaskPage(teamId, 0, headers);
    allTasks = allTasks.concat(page0Result.tasks);

    // Se houver mais páginas, busca em lotes paralelos (Promise.all)
    if (!page0Result.lastPage) {
      const BATCH_SIZE = 5;
      let startPage = 1;
      let shouldContinue = true;

      while (shouldContinue && startPage <= 15) {
        const pagesToFetch = Array.from({ length: BATCH_SIZE }, (_, i) => startPage + i);
        const batchResults = await Promise.all(
          pagesToFetch.map((p) => fetchTaskPage(teamId, p, headers))
        );

        for (const result of batchResults) {
          allTasks = allTasks.concat(result.tasks);
          if (result.lastPage) {
            shouldContinue = false;
            break;
          }
        }
        startPage += BATCH_SIZE;
      }
    }

    // Classifica tarefas e constrói métricas
    const summary = {
      total: allTasks.length,
      done: 0,
      approved: 0,
      late: 0,
      scheduled: 0,
      pending: 0,
    };

    const processedTasks = allTasks.map((t) => {
      const classification = classifyTask(t);
      summary[classification]++;

      return {
        id: t.id,
        name: t.name,
        classification,
        statusName: t.status?.status || "Pendente",
        statusType: t.status?.type || "open",
        dueDate: t.due_date ? parseInt(t.due_date, 10) : null,
        url: t.url || `https://app.clickup.com/t/${t.id}`,
        listName: t.list?.name || "",
        assignees: (t.assignees && t.assignees.length > 0)
          ? t.assignees.map((a) => ({
              id: String(a.id),
              name: a.username || a.email || "Sem nome",
              color: a.color || "#105D8F",
            }))
          : [{ id: "unassigned", name: "Sem responsável", color: "#5C4C44" }],
        tags: (t.tags && t.tags.length > 0)
          ? t.tags.map((tg) => ({
              name: tg.name,
              bg: tg.tag_bg || "#262626",
              fg: tg.tag_fg || "#E9E9E9",
            }))
          : [{ name: "Sem etiqueta", bg: "#262626", fg: "#8992A6" }],
      };
    });

    // Agrupa por Pessoa e por Etiqueta
    const personMap = new Map<string, { id: string; name: string; color: string; tasks: typeof processedTasks }>();
    const tagMap = new Map<string, { name: string; bg: string; fg: string; tasks: typeof processedTasks }>();

    processedTasks.forEach((t) => {
      t.assignees.forEach((a) => {
        if (!personMap.has(a.id)) {
          personMap.set(a.id, { id: a.id, name: a.name, color: a.color, tasks: [] });
        }
        personMap.get(a.id)!.tasks.push(t);
      });

      t.tags.forEach((tg) => {
        if (!tagMap.has(tg.name)) {
          tagMap.set(tg.name, { name: tg.name, bg: tg.bg, fg: tg.fg, tasks: [] });
        }
        tagMap.get(tg.name)!.tasks.push(t);
      });
    });

    const groupsByPerson = Array.from(personMap.values()).sort((a, b) => b.tasks.length - a.tasks.length);
    const groupsByTag = Array.from(tagMap.values()).sort((a, b) => b.tasks.length - a.tasks.length);

    const responsePayload = {
      team: { id: teamId, name: teamName },
      summary,
      tasks: processedTasks,
      groups: {
        byPerson: groupsByPerson,
        byTag: groupsByTag,
      },
      updatedAt: new Date().toISOString(),
    };

    // Salva no cache em memória
    memoryCache = {
      data: responsePayload,
      timestamp: Date.now(),
    };

    return NextResponse.json(responsePayload, {
      headers: {
        "X-Cache": "MISS",
      },
    });
  } catch (error: any) {
    console.error("Erro na API ClickUp:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao conectar com ClickUp" },
      { status: 500 }
    );
  }
}
