const PORTAL_URL = process.env.PORTAL_URL || "https://traqueamento.cpdigitalmkt.com.br";
const PORTAL_PASSWORD = process.env.PORTAL_PASSWORD || "Azul";

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export interface PortalConta {
  id: string;
  nome: string;
  tipo: string;
  variante: "completo" | "midia" | "leads" | string;
  primeiro_mes: string;
}

export interface PortalMedia {
  spend: number;
  impressions: number;
  clicks: number;
  messages: number;
  leads: number;
  leads_spend: number;
  engajamento: number;
  reach: number;
  frequency: number;
  cpm: number;
  cpc: number;
  ctr: number;
  custo_conversa: number;
  custo_lead: number;
}

export interface PortalEventoVenda {
  nome: string;
  vendas: number;
  receita: number;
  ticket: number;
}

export interface PortalVendas {
  total: number;
  faturamento: number;
  roas: number;
  custo_venda: number;
  eventos?: PortalEventoVenda[];
}

export interface PortalFunil {
  conversas?: number;
  reservas?: number;
  compras?: number;
  leads?: number;
  roas_pixel?: number;
}

export interface PortalIniciativa {
  nome: string;
  unidade: string;
  investimento: number;
  impressoes: number;
  resultado: number;
}

export interface PortalCriativoCard {
  id: string;
  nome: string;
  sub: string;
  thumb: string;
  valor: number;
}

export interface PortalCriativoGrupo {
  obj: string;
  unidade: string;
  cards: PortalCriativoCard[];
}

export interface PortalInstagramSerie {
  d: string;
  f: number;
}

export interface PortalInstagram {
  username: string;
  seguidores: number;
  ganho: number;
  desde: string;
  parcial: boolean;
  serie: PortalInstagramSerie[];
}

export interface PortalReportData {
  synced_at?: string;
  conta: {
    id: string;
    nome: string;
    eyebrow: string;
    variante: string;
    subtitle?: string;
    nota?: string | null;
  };
  periodo: {
    label: string;
    from: string;
    to: string;
  };
  media: PortalMedia;
  vendas: PortalVendas;
  funil?: PortalFunil;
  iniciativas?: PortalIniciativa[];
  criativos?: PortalCriativoGrupo[];
  instagram?: PortalInstagram;
  leitura_custom?: string | null;
  verba?: {
    bruto: number;
    imposto?: number;
    pct: number;
    liquido: number;
    gasto: number;
    restante: number;
  } | null;
}

export interface PortalOrganicoPost {
  id: string;
  data: string;
  tipo: string;
  produto?: string;
  img?: string;
  likes: number;
  link?: string;
}

export interface PortalOrganicoStory {
  id: string;
  data: string;
  tipo: string;
  img?: string;
}

export interface PortalOrganicoData {
  organico?: {
    username: string;
    erro?: string;
    posts?: PortalOrganicoPost[];
    stories?: PortalOrganicoStory[];
  };
}

/**
 * Autentica no portal e retorna o token JWT ativo.
 */
export async function getPortalToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const res = await fetch(`${PORTAL_URL}/portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: PORTAL_PASSWORD }),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erro de autenticacao no portal: ${res.status}`);
    }

    const data = await res.json();
    if (!data.token) {
      throw new Error("Token nao retornado pelo portal");
    }

    cachedToken = data.token;
    // Token expira em 1 hora; renovamos com 50 min
    tokenExpiresAt = now + 50 * 60 * 1000;
    return cachedToken as string;
  } catch (error) {
    console.error("Falha no login do portal de traqueamento:", error);
    throw error;
  }
}

/**
 * Faz requisições autenticadas para o portal.
 */
async function fetchPortalApi<T>(endpointPath: string): Promise<T> {
  let token = await getPortalToken();
  let url = `${PORTAL_URL}${endpointPath}`;

  let res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    // Tenta renovar o token e repetir uma vez
    cachedToken = null;
    tokenExpiresAt = 0;
    token = await getPortalToken();
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro no portal (${res.status})`);
  }

  return res.json() as Promise<T>;
}

/**
 * Lista todas as contas (empreendimentos/unidades) do portal.
 */
export async function fetchPortalContas(): Promise<PortalConta[]> {
  const data = await fetchPortalApi<{ grupo_id: string; contas: PortalConta[] }>("/portal/contas");
  return data.contas || [];
}

/**
 * Obtem o relatorio de performance de uma conta.
 * period: "mes", "7d", "14d", "30d", "custom" ou formato "YYYY-MM"
 */
export async function fetchPortalReport(
  contaId: string,
  period: string = "mes",
  from?: string,
  to?: string
): Promise<PortalReportData> {
  let query = `/portal/report?conta=${encodeURIComponent(contaId)}&period=${encodeURIComponent(period)}`;
  if (period === "custom" && from && to) {
    query += `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  }
  return fetchPortalApi<PortalReportData>(query);
}

/**
 * Obtem o conteudo organico (posts e stories) do Instagram.
 */
export async function fetchPortalOrganico(
  contaId: string,
  period: string = "mes",
  from?: string,
  to?: string
): Promise<PortalOrganicoData> {
  let query = `/portal/organico?conta=${encodeURIComponent(contaId)}&period=${encodeURIComponent(period)}`;
  if (period === "custom" && from && to) {
    query += `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  }
  return fetchPortalApi<PortalOrganicoData>(query);
}

/**
 * Obtem o preview HTML de um anuncio.
 */
export async function fetchPortalAdPreview(contaId: string, adId: string): Promise<{ html?: string; error?: string }> {
  const query = `/portal/preview?conta=${encodeURIComponent(contaId)}&ad_id=${encodeURIComponent(adId)}`;
  return fetchPortalApi<{ html?: string; error?: string }>(query);
}
