import { PrismaClient, Company } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import DOMPurify from "isomorphic-dompurify";

const parseDbUrl = (urlStr: string) => {
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.substring(1),
    };
  } catch (error) {
    console.error("Erro ao analisar DATABASE_URL:", error);
    return null;
  }
};

// Initialize Prisma client
let prismaClient: PrismaClient | null = null;
let isDbConnected = false;

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var __mockRoles: MockRoleConfig[] | undefined;
  var __mockUsers: MockUser[] | undefined;
  var __mockPanels: MockSystemPanel[] | undefined;
  var __mockDocuments: MockDocument[] | undefined;
  var __mockLogs: MockAuditLog[] | undefined;
  var __mockAnnouncements: MockAnnouncement[] | undefined;
  var __mockAnnouncementReads: MockAnnouncementRead[] | undefined;
  var __mockCompanies: MockCompany[] | undefined;
  var __mockBusinessUnits: MockBusinessUnit[] | undefined;
  var __mockLevels: MockLevelConfig[] | undefined;
  var __mockMenuPermissions: MockMenuPermission[] | undefined;
  var __mockMfaUsers: MockUserMfa[] | undefined;
}

export interface MockUserMfa {
  id: string;
  userId: string;
  secret: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

try {
  if (process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production") {
      const dbParams = parseDbUrl(process.env.DATABASE_URL);
      if (dbParams) {
        const adapter = new PrismaMariaDb({
          host: dbParams.host,
          port: dbParams.port,
          user: dbParams.user,
          password: dbParams.password,
          database: dbParams.database,
          connectionLimit: 2,
        });
        prismaClient = new PrismaClient({ adapter });
        isDbConnected = true;
      }
    } else {
      if (!global.prismaGlobal) {
        const dbParams = parseDbUrl(process.env.DATABASE_URL);
        if (dbParams) {
          const adapter = new PrismaMariaDb({
            host: dbParams.host,
            port: dbParams.port,
            user: dbParams.user,
            password: dbParams.password,
            database: dbParams.database,
            connectionLimit: 2,
          });
          global.prismaGlobal = new PrismaClient({ adapter });
        }
      }
      prismaClient = global.prismaGlobal || null;
      if (prismaClient) {
        isDbConnected = true;
      }
    }
  }
} catch (error) {
  console.warn(
    "Nao foi possivel conectar ao banco de dados. Usando fallback local.",
    error,
  );
}

export const prisma = prismaClient;
export const isDatabaseConnected = () => isDbConnected;

// ============================================
// DATABASE ABSTRACTION LAYER
// ============================================
// This is the single source of truth for all database operations.
// It automatically uses Prisma when connected, mock only in dev without DB.

// Check if we should use mock data
const USE_MOCK_DB = process.env.USE_MOCK_DB === "true";

if (USE_MOCK_DB) {
  console.warn(
    "⚠️  USANDO MOCK DATABASE (dbSim) - Apenas para desenvolvimento!",
  );
}

// ============================================
// TYPES (re-exported for convenience)
// ============================================
export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string;
  password?: string;
  role: string;
  hierarchyLevel: number;
  company: Company;
  status: string;
  createdAt: Date;
}

export interface MockSystemPanel {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  minRole: string;
  minHierarchy: number;
  isActive: boolean;
  companySlug?: string | null;
}

export interface MockDocument {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  category: Company;
  minHierarchyLevel: number;
  uploadedById: string;
  uploadedByName: string;
  createdAt: Date;
}

export interface MockAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface MockRoleConfig {
  id: string;
  name: string;
  displayName: string;
  hierarchyLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetCompanies: string;
  expiresAt: Date | null;
  isPinned: boolean;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAnnouncementRead {
  id: string;
  announcementId: string;
  userId: string;
  readAt: Date;
}

export interface MockBusinessUnit {
  id: string;
  name: string;
  slug: string;
  company: Company;
  description: string;
  logo: string;
  coverImage: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  isActive: boolean;
  order: number;
  showOnHome: boolean;
  createdAt: Date;
  updatedAt: Date;
  tools?: MockBusinessUnitTool[];
  socialLinks?: MockBusinessUnitSocialLink[];
  analytics?: MockBusinessUnitAnalytics[];
  metaData?: MockBusinessUnitMetaData[];
  revenueData?: MockBusinessUnitRevenue[];
}

export interface MockBusinessUnitTool {
  id: string;
  businessUnitId: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: string;
  isExternal: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockBusinessUnitSocialLink {
  id: string;
  businessUnitId: string;
  platform: string;
  url: string;
  handle: string;
  followersCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockBusinessUnitAnalytics {
  id: string;
  businessUnitId: string;
  date: Date;
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
  source: string;
  createdAt: Date;
}

export interface MockBusinessUnitMetaData {
  id: string;
  businessUnitId: string;
  date: Date;
  platform: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  createdAt: Date;
}

export interface MockBusinessUnitRevenue {
  id: string;
  businessUnitId: string;
  period: string;
  amount: number;
  currency: string;
  type: string;
  source: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockLevelConfig {
  id: string;
  level: number;
  name: string;
  createdAt: Date;
}

export interface MockMenuPermission {
  href: string;
  name: string;
  minLevel: number;
}

const mockLevels: MockLevelConfig[] = globalThis.__mockLevels ?? (globalThis.__mockLevels = [
  { id: "lvl-1", level: 1, name: "Direcao Geral", createdAt: new Date() },
  { id: "lvl-2", level: 2, name: "Gerencia / Coordenacao", createdAt: new Date() },
  { id: "lvl-3", level: 3, name: "Operacional", createdAt: new Date() },
]);

const mockMenuPermissions: MockMenuPermission[] = globalThis.__mockMenuPermissions ?? (globalThis.__mockMenuPermissions = [
  { href: "/dashboard", name: "Painel Principal", minLevel: 3 },
  { href: "/dashboard/ferramentas", name: "Ferramentas", minLevel: 3 },
  { href: "/dashboard/comunicados", name: "Comunicados", minLevel: 3 },
  { href: "/dashboard/unidades", name: "Unidades de Negocio", minLevel: 3 },
  { href: "/dashboard/documentos", name: "Drive de Arquivos", minLevel: 3 },
  { href: "/dashboard/seguranca", name: "Seguranca & Niveis", minLevel: 1 },
  { href: "/dashboard/configuracoes", name: "Configuracoes", minLevel: 99 },
]);

// Initial mock data (persisted via globalThis to survive hot reloads)
const mockRoles: MockRoleConfig[] = globalThis.__mockRoles ?? (globalThis.__mockRoles = [
  {
    id: "role-admin",
    name: "ADMIN",
    displayName: "Direcao Geral",
    hierarchyLevel: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "role-coordinator",
    name: "COORDINATOR",
    displayName: "Gerencia",
    hierarchyLevel: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "role-viewer",
    name: "VIEWER",
    displayName: "Operacional",
    hierarchyLevel: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

if (globalThis.__mockUsers && !globalThis.__mockUsers.some(u => u.email === "gerente@grupoazul.com.br")) {
  globalThis.__mockUsers = undefined;
}

const mockUsers: MockUser[] = globalThis.__mockUsers ?? (globalThis.__mockUsers = [
  {
    id: "user-central-admin",
    name: "Administrador Central",
    email: "admin@grupoazul.com.br",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    password: "admin12345",
    role: "ADMIN",
    hierarchyLevel: 1,
    company: Company.CENTRAL,
    status: "ACTIVE",
    createdAt: new Date(),
  },
  {
    id: "user-central-coordinator",
    name: "Gerente Central",
    email: "gerente@grupoazul.com.br",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
    password: "gerente123",
    role: "COORDINATOR",
    hierarchyLevel: 2,
    company: Company.CENTRAL,
    status: "ACTIVE",
    createdAt: new Date(),
  },
  {
    id: "user-central-viewer",
    name: "Operador Central",
    email: "operador@grupoazul.com.br",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
    password: "operador123",
    role: "VIEWER",
    hierarchyLevel: 3,
    company: Company.CENTRAL,
    status: "ACTIVE",
    createdAt: new Date(),
  },
]);

const mockPanels: MockSystemPanel[] = globalThis.__mockPanels ?? (globalThis.__mockPanels = [
  {
    id: "panel-1",
    name: "CRM - Grupo Azul",
    description:
      "Plataforma de CRM e gestao comercial do Grupo Azul Incorporacoes.",
    url: "https://azulcrm-dykanzmd.manus.space",
    icon: "Building2",
    category: "AZUL",
    minRole: "COORDINATOR",
    minHierarchy: 2,
    isActive: true,
  },
  {
    id: "panel-2",
    name: "Borgo del Vino - Parceiros",
    description: "Portal e area de parceiros do empreendimento Borgo del Vino.",
    url: "https://borgodelvino.com.br/parceiros",
    icon: "Wine",
    category: "BORGO",
    minRole: "VIEWER",
    minHierarchy: 3,
    isActive: true,
  },
  {
    id: "panel-3",
    name: "Borgo del Vino - Painel Admin",
    description: "Painel administrativo para gestao interna do Borgo del Vino.",
    url: "https://borgodelvino.com.br/Adminborgo",
    icon: "Wine",
    category: "BORGO",
    minRole: "COORDINATOR",
    minHierarchy: 2,
    isActive: true,
  },
  {
    id: "panel-4",
    name: "Maple Bear - Painel Admin",
    description:
      "Painel administrativo de formularias e cadastros da Maple Bear.",
    url: "https://formulario-maplebear.vercel.app/admin",
    icon: "Notebook",
    category: "MAPLE_BEAR",
    minRole: "COORDINATOR",
    minHierarchy: 2,
    isActive: true,
  },
  {
    id: "panel-5",
    name: "Central Azul - Politicas & Logs",
    description:
      "Monitoramento de seguranca de acessos e edicao de politicas da Central.",
    url: "/dashboard/seguranca",
    icon: "ShieldAlert",
    category: "CENTRAL",
    minRole: "ADMIN",
    minHierarchy: 1,
    isActive: true,
  },
  {
    id: "panel-6",
    name: "Formulario de Parcerias Azul",
    description:
      "Painel administrativo de cadastros e parcerias da Azul Incorporacoes.",
    url: "https://formulario-azul.vercel.app/admin",
    icon: "Notebook",
    category: "AZUL",
    minRole: "COORDINATOR",
    minHierarchy: 2,
    isActive: true,
  },
]);

const mockDocuments: MockDocument[] = globalThis.__mockDocuments ?? (globalThis.__mockDocuments = [
  {
    id: "doc-1",
    title: "Diretrizes de Seguranca da Informacao 2026",
    description:
      "Manual de politicas de acesso, senhas e conformidade digital do Grupo Azul.",
    fileUrl: "#",
    fileSize: 2450000,
    fileType: "application/pdf",
    category: Company.CENTRAL,
    minHierarchyLevel: 3,
    uploadedById: "user-director",
    uploadedByName: "Diretor Grupo Azul",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "doc-2",
    title: "Relatorio de Vendas Borgo del Vin - Q1 2026",
    description:
      "Acompanhamento comercial, lotes negociados e projecoes de faturamento.",
    fileUrl: "#",
    fileSize: 4200000,
    fileType: "application/pdf",
    category: Company.BORGO,
    minHierarchyLevel: 2,
    uploadedById: "user-borgo",
    uploadedByName: "Gerente Borgo del Vin",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "doc-3",
    title: "Planejamento Pedagogico Maple Bear - Semestre 2",
    description:
      "Calendario de atividades, grade curricular e metas de expansao.",
    fileUrl: "#",
    fileSize: 1800000,
    fileType: "application/pdf",
    category: Company.MAPLE_BEAR,
    minHierarchyLevel: 3,
    uploadedById: "user-maple",
    uploadedByName: "Coordenador Maple Bear",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
]);

const mockLogs: MockAuditLog[] = globalThis.__mockLogs ?? (globalThis.__mockLogs = [
  {
    id: "log-1",
    userId: "user-director",
    userName: "Diretor Grupo Azul",
    action: "LOGIN",
    details: "Autenticacao realizada com sucesso via Outlook (Entra ID)",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: "log-2",
    userId: "user-director",
    userName: "Diretor Grupo Azul",
    action: "ALTERAR_HIERARQUIA",
    details:
      "Alterou o nivel de acesso de 'Coordenador Maple Bear' para Nivel 2",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: "log-3",
    userId: "user-borgo",
    userName: "Gerente Borgo del Vin",
    action: "ACESSO_PAINEL",
    details: "Acessou o painel 'Borgo del Vin - CRM & Vendas'",
    ipAddress: "187.32.45.122",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15",
    createdAt: new Date(Date.now() - 20 * 60 * 1000),
  },
]);

// Fase 1 - Mock Announcements
const mockAnnouncements: MockAnnouncement[] = globalThis.__mockAnnouncements ?? (globalThis.__mockAnnouncements = [
  {
    id: "ann-1",
    title: "Nova integração de Segurança",
    content:
      "Todas as credenciais de ferramentas agora estão integradas com o token ativo do Outlook profissional. Não é mais necessário login separado para acessar os painéis.",
    priority: "IMPORTANT",
    targetCompanies: "",
    expiresAt: null,
    isPinned: true,
    isActive: true,
    createdById: "user-director",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "ann-2",
    title: "Manutenção Hostinger MySQL",
    content:
      "Manutenção programada do banco de dados na madrugada de domingo das 02:00 às 04:00. A CentralAzul CentralAzul pode ficar indisponível neste período.",
    priority: "WARNING",
    targetCompanies: "",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isPinned: false,
    isActive: true,
    createdById: "user-admin",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "ann-3",
    title: "Atualização de Políticas de Acesso",
    content:
      "Foram atualizadas novas diretrizes de segurança da informação. Todos os colaboradores devem revisar o documento 'Diretrizes de Segurança da Informação 2026' disponível no Drive.",
    priority: "INFO",
    targetCompanies: "",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isPinned: false,
    isActive: true,
    createdById: "user-director",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
]);

const mockAnnouncementReads: MockAnnouncementRead[] = globalThis.__mockAnnouncementReads ?? (globalThis.__mockAnnouncementReads = []);

const mockMfaUsers: MockUserMfa[] = globalThis.__mockMfaUsers ?? (globalThis.__mockMfaUsers = []);

export interface MockCompany {
  id: string;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
  showOnHome: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export const mockCompanies: MockCompany[] = globalThis.__mockCompanies ?? (globalThis.__mockCompanies = [
  {
    id: "comp-1",
    name: "Borgo del Vino",
    slug: "BORGO",
    color: "WINE",
    isActive: true,
    showOnHome: true,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "comp-2",
    name: "Maple Bear",
    slug: "MAPLE_BEAR",
    color: "RED",
    isActive: true,
    showOnHome: true,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "comp-3",
    name: "Grupo Azul",
    slug: "AZUL",
    color: "AZUL",
    isActive: true,
    showOnHome: true,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "comp-4",
    name: "Central",
    slug: "CENTRAL",
    color: "GOLD",
    isActive: true,
    showOnHome: true,
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// ============================================
// ACCOUNT LOCKOUT STATE (In-Memory Map for dev mode)
// ============================================
// Stores failed login attempts and lockout timestamps per email
const lockoutState = new Map<string, { attempts: number; lockedUntil?: Date }>();

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Persistent state handlers in memory (simulating a database server)
// We will expose database simulation functions so that even if MySQL is not connected,
// roles, logs, and files are updated in real-time on the server.
export const dbSim = {
  getUsers: async () => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.user.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            role: true,
            hierarchyLevel: true,
            company: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    return mockUsers.map((u) => {
      const { password: _password, ...rest } = u;
      void _password;
      return rest;
    });
  },

  getUserByEmail: async (email: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.user.findUnique({
          where: { email },
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    return (
      mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      null
    );
  },

  getUserById: async (id: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.user.findUnique({
          where: { id },
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    return mockUsers.find((u) => u.id === id) || null;
  },

  updateUserHierarchy: async (
    id: string,
    role: string,
    level: number,
    status?: string,
  ) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.user.update({
          where: { id },
          data: {
            role,
            hierarchyLevel: level,
            ...(status ? { status } : {}),
          },
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      user.role = role;
      user.hierarchyLevel = level;
      if (status) user.status = status;
      return user;
    }
    return null;
  },

  updateUserProfile: async (
    id: string,
    data: { name?: string; image?: string; password?: string }
  ) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.user.update({
          where: { id },
          data,
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      if (data.name !== undefined) user.name = data.name;
      if (data.image !== undefined) user.image = data.image;
      if (data.password !== undefined) user.password = data.password;
      return user;
    }
    return null;
  },

  addUser: async (user: {
    name: string;
    email: string;
    role: string;
    hierarchyLevel: number;
    company: Company;
    password?: string;
  }) => {
    const newUser: MockUser = {
      ...user,
      id: "user-" + Math.random().toString(36).substr(2, 9),
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
      status: "ACTIVE",
      createdAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createData: any = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          image: newUser.image,
          password: newUser.password || null,
          role: newUser.role,
          hierarchyLevel: newUser.hierarchyLevel,
          company: newUser.company,
          status: newUser.status,
        };
        return await prismaClient.user.create({
          data: createData,
        });
      } catch (e) {
        console.error("Prisma error adding user, falling back", e);
      }
    }
    mockUsers.push(newUser);
    return newUser;
  },

  getPanels: async () => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.systemPanel.findMany({
          orderBy: { createdAt: "desc" },
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    return mockPanels;
  },

  getDocuments: async (
    userLevel?: number,
    userCompany?: Company,
  ) => {
    // Applicative RLS via Prisma where clause.
    // Level 1 (Direcao Geral) sees ALL docs.
    // Level 2+ sees only docs where minHierarchyLevel >= userLevel
    //   AND (category == userCompany OR category == CENTRAL).
    const whereFilter =
      userLevel !== undefined && userLevel !== 1 && userCompany
        ? {
            minHierarchyLevel: { gte: userLevel },
            OR: [{ category: userCompany }, { category: Company.CENTRAL }],
          }
        : userLevel !== undefined && userLevel !== 1 && !userCompany
          ? { minHierarchyLevel: { gte: userLevel } }
          : undefined;

    if (prismaClient && isDbConnected) {
      try {
        const dbDocs = await prismaClient.document.findMany({
          where: whereFilter as never,
          include: { uploadedBy: true },
          orderBy: { createdAt: "desc" },
        });
        return dbDocs.map((d) => ({
          id: d.id,
          title: d.title,
          description: DOMPurify.sanitize(d.description || ""),
          fileUrl: d.fileUrl,
          fileSize: d.fileSize || 0,
          fileType: d.fileType || "",
          category: d.category,
          minHierarchyLevel: d.minHierarchyLevel,
          uploadedById: d.uploadedById,
          uploadedByName: d.uploadedBy.name || "Usuario",
          createdAt: d.createdAt,
        }));
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    // Mock fallback: apply same RLS filter
    let mockResult = mockDocuments.map((doc) => ({
      ...doc,
      description: DOMPurify.sanitize(doc.description),
    }));
    if (userLevel !== undefined && userLevel !== 1) {
      mockResult = mockResult.filter(
        (doc) =>
          doc.minHierarchyLevel >= userLevel &&
          (!userCompany ||
            doc.category === userCompany ||
            doc.category === Company.CENTRAL),
      );
    }
    return mockResult;
  },

  addDocument: async (
    doc: Omit<MockDocument, "id" | "createdAt" | "uploadedByName">,
  ) => {
    const newDoc: MockDocument = {
      ...doc,
      id: "doc-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      uploadedByName:
        mockUsers.find((u) => u.id === doc.uploadedById)?.name || "Usuario",
    };
    if (prismaClient && isDbConnected) {
      try {
        // Ensure user exists in db first
        let dbUser = await prismaClient.user.findUnique({
          where: { id: doc.uploadedById },
        });
        if (!dbUser) {
          const user = mockUsers.find((u) => u.id === doc.uploadedById);
          if (user) {
            dbUser = await prismaClient.user.create({
              data: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
                hierarchyLevel: user.hierarchyLevel,
                company: user.company,
              },
            });
          }
        }
        const created = await prismaClient.document.create({
          data: {
            title: doc.title,
            description: doc.description,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            fileType: doc.fileType,
            category: doc.category,
            minHierarchyLevel: doc.minHierarchyLevel,
            uploadedById: doc.uploadedById,
          },
          include: { uploadedBy: true },
        });
        return {
          id: created.id,
          title: created.title,
          description: created.description || "",
          fileUrl: created.fileUrl,
          fileSize: created.fileSize || 0,
          fileType: created.fileType || "",
          category: created.category,
          minHierarchyLevel: created.minHierarchyLevel,
          uploadedById: created.uploadedById,
          uploadedByName: created.uploadedBy.name || "Usuario",
          createdAt: created.createdAt,
        };
      } catch (e) {
        console.error("Prisma error creating document, falling back", e);
      }
    }
    mockDocuments.unshift(newDoc);
    return newDoc;
  },

  getLogs: async (
    userLevel?: number,
    userCompany?: Company,
  ) => {
    // Applicative RLS for audit logs.
    // Level 1 sees ALL logs. Level 2 sees only logs from users in their company.
    const whereFilter =
      userLevel !== undefined && userLevel === 2 && userCompany
        ? { user: { company: userCompany } }
        : undefined;

    if (prismaClient && isDbConnected) {
      try {
        const dbLogs = await prismaClient.auditLog.findMany({
          where: whereFilter as never,
          include: { user: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        return dbLogs.map((l) => ({
          id: l.id,
          userId: l.userId,
          userName: l.user.name || "Usuario",
          action: l.action,
          details: l.details,
          ipAddress: l.ipAddress || "",
          userAgent: l.userAgent || "",
          createdAt: l.createdAt,
        }));
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    // Mock fallback: apply same RLS filter by matching user company
    let mockResult = mockLogs;
    if (userLevel !== undefined && userLevel === 2 && userCompany) {
      const companyUserIds = mockUsers
        .filter((u) => u.company === userCompany)
        .map((u) => u.id);
      mockResult = mockLogs.filter((log) =>
        companyUserIds.includes(log.userId),
      );
    }
    return mockResult;
  },

  addLog: async (
    userId: string,
    action: string,
    details: string,
    ipAddress?: string,
    userAgent?: string,
  ) => {
    const userObj = mockUsers.find((u) => u.id === userId);
    const newLog: MockAuditLog = {
      id: "log-" + Math.random().toString(36).substr(2, 9),
      userId,
      userName: userObj?.name || "Usuario",
      action,
      details,
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "Browser",
      createdAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        // Ensure user exists in db first
        let dbUser = await prismaClient.user.findUnique({
          where: { id: userId },
        });
        if (!dbUser) {
          if (userObj) {
            dbUser = await prismaClient.user.create({
              data: {
                id: userObj.id,
                name: userObj.name,
                email: userObj.email,
                image: userObj.image,
                role: userObj.role,
                hierarchyLevel: userObj.hierarchyLevel,
                company: userObj.company,
              },
            });
          }
        }
        await prismaClient.auditLog.create({
          data: {
            userId,
            action,
            details,
            ipAddress,
            userAgent,
          },
        });
      } catch (e) {
        console.error("Prisma error adding log, falling back", e);
      }
    }
    mockLogs.unshift(newLog);
    return newLog;
  },

  // RoleConfig simulation and database methods
  getRoles: async () => {
    if (prismaClient && isDbConnected) {
      try {
        const dbRoles = await prismaClient.roleConfig.findMany({
          orderBy: { hierarchyLevel: "asc" },
        });
        if (dbRoles.length > 0) {
          return dbRoles.map((r) => ({
            id: r.id,
            name: r.name,
            displayName: r.displayName,
            hierarchyLevel: r.hierarchyLevel,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }));
        }

        // Seed database if roleConfigs table is empty
        for (const r of mockRoles) {
          await prismaClient.roleConfig.create({
            data: {
              name: r.name,
              displayName: r.displayName,
              hierarchyLevel: r.hierarchyLevel,
            },
          });
        }
        const refetched = await prismaClient.roleConfig.findMany({
          orderBy: { hierarchyLevel: "asc" },
        });
        return refetched.map((r) => ({
          id: r.id,
          name: r.name,
          displayName: r.displayName,
          hierarchyLevel: r.hierarchyLevel,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      } catch (e) {
        console.error("Prisma error fetching roles, falling back", e);
      }
    }
    return mockRoles;
  },

  addRole: async (role: {
    name: string;
    displayName: string;
    hierarchyLevel: number;
  }) => {
    const nameUpper = role.name.toUpperCase().replace(/\s+/g, "_");
    const newRole: MockRoleConfig = {
      id: "role-" + Math.random().toString(36).substr(2, 9),
      name: nameUpper,
      displayName: role.displayName,
      hierarchyLevel: role.hierarchyLevel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        const created = await prismaClient.roleConfig.create({
          data: {
            name: nameUpper,
            displayName: role.displayName,
            hierarchyLevel: role.hierarchyLevel,
          },
        });
        return {
          id: created.id,
          name: created.name,
          displayName: created.displayName,
          hierarchyLevel: created.hierarchyLevel,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (e) {
        console.error("Prisma error creating role, falling back", e);
      }
    }
    mockRoles.push(newRole);
    return newRole;
  },

  updateRole: async (
    id: string,
    updates: { name?: string; displayName?: string; hierarchyLevel?: number },
  ) => {
    const nameUpper = updates.name
      ? updates.name.toUpperCase().replace(/\s+/g, "_")
      : undefined;
    if (prismaClient && isDbConnected) {
      try {
        const origRole = await prismaClient.roleConfig.findUnique({
          where: { id },
        });
        const updated = await prismaClient.$transaction(async (tx) => {
          const updatedRole = await tx.roleConfig.update({
            where: { id },
            data: {
              ...(nameUpper ? { name: nameUpper } : {}),
              ...(updates.displayName
                ? { displayName: updates.displayName }
                : {}),
              ...(updates.hierarchyLevel !== undefined
                ? { hierarchyLevel: updates.hierarchyLevel }
                : {}),
            },
          });

          if (origRole && nameUpper && origRole.name !== nameUpper) {
            // Update users
            await tx.user.updateMany({
              where: { role: origRole.name },
              data: { role: nameUpper },
            });
            // Update system panels
            await tx.systemPanel.updateMany({
              where: { minRole: origRole.name },
              data: { minRole: nameUpper },
            });
          }
          return updatedRole;
        });
        return {
          id: updated.id,
          name: updated.name,
          displayName: updated.displayName,
          hierarchyLevel: updated.hierarchyLevel,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      } catch (e) {
        console.error("Prisma error updating role, falling back", e);
      }
    }
    const role = mockRoles.find((r) => r.id === id);
    if (role) {
      const oldName = role.name;
      const oldRole = { ...role };
      try {
        if (nameUpper) role.name = nameUpper;
        if (updates.displayName) role.displayName = updates.displayName;
        if (updates.hierarchyLevel !== undefined)
          role.hierarchyLevel = updates.hierarchyLevel;
        role.updatedAt = new Date();

        if (nameUpper && oldName !== nameUpper) {
          // Update mock users role
          for (const u of mockUsers) {
            if (u.role === oldName) u.role = nameUpper;
          }
          // Update mock panels minRole
          for (const p of mockPanels) {
            if (p.minRole === oldName) p.minRole = nameUpper;
          }
        }
        return role;
      } catch (e) {
        Object.assign(role, oldRole);
        throw e;
      }
    }
    return null;
  },

  deleteRole: async (id: string) => {
    if (prismaClient && isDbConnected) {
      try {
        const origRole = await prismaClient.roleConfig.findUnique({
          where: { id },
        });
        if (origRole) {
          await prismaClient.$transaction(async (tx) => {
            // Reassign users of this role to VIEWER (or another base role) before deletion
            await tx.user.updateMany({
              where: { role: origRole.name },
              data: { role: "VIEWER" },
            });
            // Reassign system panels
            await tx.systemPanel.updateMany({
              where: { minRole: origRole.name },
              data: { minRole: "VIEWER" },
            });

            await tx.roleConfig.delete({ where: { id } });
          });
          return true;
        }
      } catch (e) {
        console.error("Prisma error deleting role, falling back", e);
      }
    }
    const index = mockRoles.findIndex((r) => r.id === id);
    if (index !== -1) {
      const deletedName = mockRoles[index].name;
      const deletedRole = mockRoles[index];
      const affectedUsers: typeof mockUsers = [];
      const affectedPanels: typeof mockPanels = [];
      try {
        mockRoles.splice(index, 1);
        // Reassign mock users
        for (const u of mockUsers) {
          if (u.role === deletedName) {
            u.role = "VIEWER";
            affectedUsers.push(u);
          }
        }
        // Reassign mock panels
        for (const p of mockPanels) {
          if (p.minRole === deletedName) {
            p.minRole = "VIEWER";
            affectedPanels.push(p);
          }
        }
        return true;
      } catch (e) {
        mockRoles.splice(index, 0, deletedRole);
        for (const u of affectedUsers) {
          u.role = deletedName;
        }
        for (const p of affectedPanels) {
          p.minRole = deletedName;
        }
        throw e;
      }
    }
    return false;
  },

  // Fase 1 - Announcements
  getAnnouncements: async () => {
    if (prismaClient && isDbConnected) {
      try {
        const announcements = await prismaClient.announcement.findMany({
          orderBy: { createdAt: "desc" },
        });
        return announcements.map((announcement) => ({
          ...announcement,
          content: DOMPurify.sanitize(announcement.content),
        }));
      } catch (e) {
        console.error("Prisma error fetching announcements, falling back", e);
      }
    }
    return mockAnnouncements.map((announcement) => ({
      ...announcement,
      content: DOMPurify.sanitize(announcement.content),
    }));
  },

  getAnnouncementReadsByUser: async (userId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.announcementRead.findMany({
          where: { userId },
        });
      } catch (e) {
        console.error(
          "Prisma error fetching announcement reads, falling back",
          e,
        );
      }
    }
    return mockAnnouncementReads.filter((r) => r.userId === userId);
  },

  addAnnouncement: async (
    ann: Omit<MockAnnouncement, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newAnn: MockAnnouncement = {
      ...ann,
      id: "ann-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        const created = await prismaClient.announcement.create({
          data: {
            id: newAnn.id,
            title: newAnn.title,
            content: newAnn.content,
            priority: newAnn.priority,
            targetCompanies: newAnn.targetCompanies,
            expiresAt: newAnn.expiresAt,
            isPinned: newAnn.isPinned,
            isActive: newAnn.isActive,
            createdById: newAnn.createdById,
          },
        });
        return {
          id: created.id,
          title: created.title,
          content: created.content,
          priority: created.priority,
          targetCompanies: created.targetCompanies,
          expiresAt: created.expiresAt,
          isPinned: created.isPinned,
          isActive: created.isActive,
          createdById: created.createdById,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (e) {
        console.error("Prisma error creating announcement, falling back", e);
      }
    }
    mockAnnouncements.unshift(newAnn);
    return newAnn;
  },

  updateAnnouncement: async (
    id: string,
    updates: Partial<MockAnnouncement>,
  ) => {
    if (prismaClient && isDbConnected) {
      try {
        const updated = await prismaClient.announcement.update({
          where: { id },
          data: {
            ...(updates.title ? { title: updates.title } : {}),
            ...(updates.content ? { content: updates.content } : {}),
            ...(updates.priority ? { priority: updates.priority } : {}),
            ...(updates.targetCompanies !== undefined
              ? { targetCompanies: updates.targetCompanies }
              : {}),
            ...(updates.expiresAt !== undefined
              ? { expiresAt: updates.expiresAt }
              : {}),
            ...(updates.isPinned !== undefined
              ? { isPinned: updates.isPinned }
              : {}),
            ...(updates.isActive !== undefined
              ? { isActive: updates.isActive }
              : {}),
          },
        });
        return updated;
      } catch (e) {
        console.error("Prisma error updating announcement, falling back", e);
      }
    }
    const index = mockAnnouncements.findIndex((a) => a.id === id);
    if (index !== -1) {
      mockAnnouncements[index] = {
        ...mockAnnouncements[index],
        ...updates,
        updatedAt: new Date(),
      };
      return mockAnnouncements[index];
    }
    return null;
  },

  deleteAnnouncement: async (id: string) => {
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.announcement.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting announcement, falling back", e);
      }
    }
    const index = mockAnnouncements.findIndex((a) => a.id === id);
    if (index !== -1) {
      mockAnnouncements.splice(index, 1);
      return true;
    }
    return false;
  },

  markAnnouncementRead: async (announcementId: string, userId: string) => {
    const newRead: MockAnnouncementRead = {
      id: "read-" + Math.random().toString(36).substr(2, 9),
      announcementId,
      userId,
      readAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.announcementRead.upsert({
          where: {
            announcementId_userId: { announcementId, userId },
          },
          create: {
            announcementId,
            userId,
          },
          update: {},
        });
      } catch (e) {
        console.error(
          "Prisma error marking announcement read, falling back",
          e,
        );
      }
    }
    const existingIndex = mockAnnouncementReads.findIndex(
      (r) => r.announcementId === announcementId && r.userId === userId,
    );
    if (existingIndex === -1) {
      mockAnnouncementReads.push(newRead);
    }
    return newRead;
  },

  // Business Units logic
  getBusinessUnitsForHome: async () => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnit.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            company: true,
            description: true,
            order: true,
            isActive: true,
            showOnHome: true,
          },
          where: {
            showOnHome: true,
            isActive: true,
          },
          orderBy: { order: "asc" },
        });
      } catch (e) {
        console.error("Prisma error fetching business units for home, returning empty", e);
        return [];
      }
    }
    return [];
  },

  getBusinessUnits: async () => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnit.findMany({
          include: {
            tools: true,
            socialLinks: true,
            analytics: { orderBy: { date: "desc" }, take: 30 },
            metaData: { orderBy: { date: "desc" }, take: 30 },
            revenueData: { orderBy: { period: "desc" }, take: 12 },
          },
          orderBy: { order: "asc" },
        });
      } catch (e) {
        console.error("Prisma error fetching business units, falling back", e);
      }
    }
    return mockBusinessUnits;
  },

  getBusinessUnitBySlug: async (slug: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnit.findUnique({
          where: { slug },
          include: {
            tools: { where: { isActive: true }, orderBy: { order: "asc" } },
            socialLinks: { where: { isActive: true } },
            analytics: { orderBy: { date: "desc" }, take: 30 },
            metaData: { orderBy: { date: "desc" }, take: 30 },
            revenueData: { orderBy: { period: "desc" }, take: 12 },
          },
        });
      } catch (e) {
        console.error("Prisma error fetching business unit, falling back", e);
      }
    }

    return mockBusinessUnits.find((bu) => bu.slug === slug) || null;
  },

  addBusinessUnit: async (
    bu: Omit<MockBusinessUnit, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newBU: MockBusinessUnit = {
      ...bu,
      id: "bu-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        const created = await prismaClient.businessUnit.create({
          data: {
            id: newBU.id,
            name: newBU.name,
            slug: newBU.slug,
            company: newBU.company,
            description: newBU.description,
            logo: newBU.logo,
            coverImage: newBU.coverImage,
            address: newBU.address,
            phone: newBU.phone,
            email: newBU.email,
            website: newBU.website,
            isActive: newBU.isActive,
            order: newBU.order,
            showOnHome: newBU.showOnHome,
          },
        });
        return {
          id: created.id,
          name: created.name,
          slug: created.slug,
          company: created.company,
          description: created.description,
          logo: created.logo,
          coverImage: created.coverImage,
          address: created.address,
          phone: created.phone,
          email: created.email,
          website: created.website,
          isActive: created.isActive,
          order: created.order,
          showOnHome: created.showOnHome,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (e) {
        console.error("Prisma error creating business unit, falling back", e);
      }
    }
    mockBusinessUnits.push(newBU);
    return newBU;
  },

  updateBusinessUnit: async (
    id: string,
    updates: Partial<MockBusinessUnit>,
  ) => {
    if (prismaClient && isDbConnected) {
      try {
        const updated = await prismaClient.businessUnit.update({
          where: { id },
          data: {
            ...(updates.name ? { name: updates.name } : {}),
            ...(updates.slug ? { slug: updates.slug } : {}),
            ...(updates.company ? { company: updates.company } : {}),
            ...(updates.description !== undefined
              ? { description: updates.description }
              : {}),
            ...(updates.logo !== undefined ? { logo: updates.logo } : {}),
            ...(updates.coverImage !== undefined
              ? { coverImage: updates.coverImage }
              : {}),
            ...(updates.address !== undefined
              ? { address: updates.address }
              : {}),
            ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
            ...(updates.email !== undefined ? { email: updates.email } : {}),
            ...(updates.website !== undefined
              ? { website: updates.website }
              : {}),
            ...(updates.isActive !== undefined
              ? { isActive: updates.isActive }
              : {}),
            ...(updates.order !== undefined ? { order: updates.order } : {}),
            ...(updates.showOnHome !== undefined
              ? { showOnHome: updates.showOnHome }
              : {}),
          },
        });
        return updated;
      } catch (e) {
        console.error("Prisma error updating business unit, falling back", e);
      }
    }
    const index = mockBusinessUnits.findIndex((bu) => bu.id === id);
    if (index !== -1) {
      mockBusinessUnits[index] = {
        ...mockBusinessUnits[index],
        ...updates,
        updatedAt: new Date(),
      };
      return mockBusinessUnits[index];
    }
    return null;
  },

  deleteBusinessUnit: async (id: string) => {
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.businessUnit.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting business unit, falling back", e);
      }
    }
    const index = mockBusinessUnits.findIndex((bu) => bu.id === id);
    if (index !== -1) {
      mockBusinessUnits.splice(index, 1);
      return true;
    }
    return false;
  },

  syncBusinessUnitData: async (slug: string) => {
    let unitId = "";
    let unitName = "";
    if (prismaClient && isDbConnected) {
      try {
        const bu = await prismaClient.businessUnit.findUnique({
          where: { slug },
        });
        if (bu) {
          unitId = bu.id;
          unitName = bu.name;
        }
      } catch (e) {
        console.error("Error finding business unit for sync", e);
      }
    } else {
      const bu = mockBusinessUnits.find((u) => u.slug === slug);
      if (bu) {
        unitId = bu.id;
        unitName = bu.name;
      }
    }

    if (!unitId) return null;

    const platforms = ["instagram", "youtube", "facebook", "linkedin"];
    const baseFollowers: Record<string, number> = {
      instagram: 12500 + Math.floor(Math.random() * 5000),
      youtube: 4300 + Math.floor(Math.random() * 1500),
      facebook: 8200 + Math.floor(Math.random() * 2000),
      linkedin: 3100 + Math.floor(Math.random() * 1000),
    };
    const handles: Record<string, string> = {
      instagram: unitName.toLowerCase().replace(/\s+/g, ""),
      youtube: unitName.toLowerCase().replace(/\s+/g, ""),
      facebook: unitName.toLowerCase().replace(/\s+/g, ""),
      linkedin: unitName.toLowerCase().replace(/\s+/g, ""),
    };
    const urls: Record<string, string> = {
      instagram: `https://instagram.com/${handles.instagram}`,
      youtube: `https://youtube.com/@${handles.youtube}`,
      facebook: `https://facebook.com/${handles.facebook}`,
      linkedin: `https://linkedin.com/company/${handles.linkedin}`,
    };

    const syncedSocials = [];
    for (const platform of platforms) {
      const followers = baseFollowers[platform];
      const handle = handles[platform];
      const url = urls[platform];

      if (prismaClient && isDbConnected) {
        try {
          const existing = await prismaClient.businessUnitSocialLink.findFirst({
            where: { businessUnitId: unitId, platform },
          });
          if (existing) {
            const updated = await prismaClient.businessUnitSocialLink.update({
              where: { id: existing.id },
              data: {
                followersCount: followers,
                handle,
                url,
                updatedAt: new Date(),
              },
            });
            syncedSocials.push(updated);
          } else {
            const created = await prismaClient.businessUnitSocialLink.create({
              data: {
                businessUnitId: unitId,
                platform,
                url,
                handle,
                followersCount: followers,
                isActive: true,
              },
            });
            syncedSocials.push(created);
          }
        } catch (e) {
          console.error("Prisma error syncing social link", e);
        }
      } else {
        const bu = mockBusinessUnits.find((u) => u.id === unitId);
        if (bu) {
          if (!bu.socialLinks) bu.socialLinks = [];
          const existingIndex = bu.socialLinks.findIndex(
            (l) => l.platform === platform,
          );
          const newSocial = {
            id: `social-${platform}-${Math.random().toString(36).substr(2, 5)}`,
            businessUnitId: unitId,
            platform,
            url,
            handle,
            followersCount: followers,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          if (existingIndex !== -1) {
            bu.socialLinks[existingIndex] = newSocial;
          } else {
            bu.socialLinks.push(newSocial);
          }
          syncedSocials.push(newSocial);
        }
      }
    }

    const syncedAnalytics = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const pageViews = 1500 + Math.floor(Math.random() * 2500);
      const uniqueVisitors = 1100 + Math.floor(Math.random() * 1800);
      const sessions = 1200 + Math.floor(Math.random() * 2000);
      const bounceRate = 35 + Math.random() * 20;
      const avgSessionDuration = 90 + Math.floor(Math.random() * 150);
      const source = "google_analytics";

      if (prismaClient && isDbConnected) {
        try {
          const existing = await prismaClient.businessUnitAnalytics.findFirst({
            where: { businessUnitId: unitId, date, source },
          });
          if (existing) {
            const updated = await prismaClient.businessUnitAnalytics.update({
              where: { id: existing.id },
              data: {
                pageViews,
                uniqueVisitors,
                sessions,
                bounceRate,
                avgSessionDuration,
              },
            });
            syncedAnalytics.push(updated);
          } else {
            const created = await prismaClient.businessUnitAnalytics.create({
              data: {
                businessUnitId: unitId,
                date,
                pageViews,
                uniqueVisitors,
                sessions,
                bounceRate,
                avgSessionDuration,
                source,
              },
            });
            syncedAnalytics.push(created);
          }
        } catch (e) {
          console.error("Prisma error syncing analytics data", e);
        }
      } else {
        const bu = mockBusinessUnits.find((u) => u.id === unitId);
        if (bu) {
          if (!bu.analytics) bu.analytics = [];
          const existingIndex = bu.analytics.findIndex(
            (a) =>
              a.date.toDateString() === date.toDateString() &&
              a.source === source,
          );
          const newAnalytic = {
            id: `analytic-${i}-${Math.random().toString(36).substr(2, 5)}`,
            businessUnitId: unitId,
            date,
            pageViews,
            uniqueVisitors,
            sessions,
            bounceRate,
            avgSessionDuration,
            source,
            createdAt: new Date(),
          };
          if (existingIndex !== -1) {
            bu.analytics[existingIndex] = newAnalytic;
          } else {
            bu.analytics.push(newAnalytic);
          }
          bu.analytics.sort((a, b) => b.date.getTime() - a.date.getTime());
          syncedAnalytics.push(newAnalytic);
        }
      }
    }

    const syncedMetaData = [];
    const platformsMeta = ["instagram", "facebook"];
    for (const platform of platformsMeta) {
      const followers = baseFollowers[platform];
      const postsCount = 45 + Math.floor(Math.random() * 15);
      const followingCount = 200 + Math.floor(Math.random() * 50);
      const engagementRate = 1.8 + Math.random() * 4.5;
      const reach = Math.floor(followers * (0.15 + Math.random() * 0.25));
      const impressions = Math.floor(reach * (1.2 + Math.random() * 0.8));
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      if (prismaClient && isDbConnected) {
        try {
          const existing = await prismaClient.businessUnitMetaData.findFirst({
            where: { businessUnitId: unitId, date, platform },
          });
          if (existing) {
            const updated = await prismaClient.businessUnitMetaData.update({
              where: { id: existing.id },
              data: {
                followersCount: followers,
                followingCount,
                postsCount,
                engagementRate,
                reach,
                impressions,
              },
            });
            syncedMetaData.push(updated);
          } else {
            const created = await prismaClient.businessUnitMetaData.create({
              data: {
                businessUnitId: unitId,
                date,
                platform,
                followersCount: followers,
                followingCount,
                postsCount,
                engagementRate,
                reach,
                impressions,
              },
            });
            syncedMetaData.push(created);
          }
        } catch (e) {
          console.error("Prisma error syncing metadata", e);
        }
      } else {
        const bu = mockBusinessUnits.find((u) => u.id === unitId);
        if (bu) {
          if (!bu.metaData) bu.metaData = [];
          const existingIndex = bu.metaData.findIndex(
            (m) =>
              m.date.toDateString() === date.toDateString() &&
              m.platform === platform,
          );
          const newMeta = {
            id: `meta-${platform}-${Math.random().toString(36).substr(2, 5)}`,
            businessUnitId: unitId,
            date,
            platform,
            followersCount: followers,
            followingCount,
            postsCount,
            engagementRate,
            reach,
            impressions,
            createdAt: new Date(),
          };
          if (existingIndex !== -1) {
            bu.metaData[existingIndex] = newMeta;
          } else {
            bu.metaData.push(newMeta);
          }
          syncedMetaData.push(newMeta);
        }
      }
    }

    if (prismaClient && isDbConnected) {
      try {
        const existingRev = await prismaClient.businessUnitRevenue.findFirst({
          where: { businessUnitId: unitId },
        });
        if (!existingRev) {
          await prismaClient.businessUnitRevenue.create({
            data: {
              businessUnitId: unitId,
              period: "2026-06",
              amount: 150000 + Math.random() * 100000,
              currency: "BRL",
              type: "gross",
              source: "manual",
              notes: "Faturamento gerado via sincronização de teste",
            },
          });
        }
      } catch (e) {
        console.error("Prisma error generating fallback revenue", e);
      }
    } else {
      const bu = mockBusinessUnits.find((u) => u.id === unitId);
      if (bu && bu.revenueData && bu.revenueData.length === 0) {
        bu.revenueData.push({
          id: `rev-${Math.random().toString(36).substr(2, 5)}`,
          businessUnitId: unitId,
          period: "2026-06",
          amount: 185000,
          currency: "BRL",
          type: "gross",
          source: "manual",
          notes: "Faturamento gerado via sincronização de teste",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return true;
  },

  addBusinessUnitTool: async (
    unitId: string,
    tool: Omit<MockBusinessUnitTool, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newTool = {
      ...tool,
      id: "tool-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitTool.create({
          data: {
            businessUnitId: unitId,
            name: tool.name,
            url: tool.url,
            icon: tool.icon || null,
            description: tool.description || null,
            category: tool.category,
            isExternal: tool.isExternal,
            order: tool.order || 0,
            isActive: tool.isActive,
          },
        });
      } catch (e) {
        console.error("Prisma error adding tool", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    if (bu) {
      if (!bu.tools) bu.tools = [];
      bu.tools.push(newTool);
      return newTool;
    }
    return null;
  },

  deleteBusinessUnitTool: async (toolId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.businessUnitTool.delete({ where: { id: toolId } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting tool", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.tools) {
        const idx = bu.tools.findIndex((t) => t.id === toolId);
        if (idx !== -1) {
          bu.tools.splice(idx, 1);
          return true;
        }
      }
    }
    return false;
  },

  addBusinessUnitSocialLink: async (
    unitId: string,
    social: Omit<MockBusinessUnitSocialLink, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newSocial = {
      ...social,
      id: "social-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitSocialLink.create({
          data: {
            businessUnitId: unitId,
            platform: social.platform,
            url: social.url,
            handle: social.handle || null,
            followersCount: social.followersCount || 0,
            isActive: social.isActive,
          },
        });
      } catch (e) {
        console.error("Prisma error adding social link", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    if (bu) {
      if (!bu.socialLinks) bu.socialLinks = [];
      bu.socialLinks.push(newSocial);
      return newSocial;
    }
    return null;
  },

  deleteBusinessUnitSocialLink: async (socialId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.businessUnitSocialLink.delete({
          where: { id: socialId },
        });
        return true;
      } catch (e) {
        console.error("Prisma error deleting social link", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.socialLinks) {
        const idx = bu.socialLinks.findIndex((s) => s.id === socialId);
        if (idx !== -1) {
          bu.socialLinks.splice(idx, 1);
          return true;
        }
      }
    }
    return false;
  },

  addBusinessUnitAnalytics: async (
    unitId: string,
    analytics: Omit<MockBusinessUnitAnalytics, "id" | "createdAt">,
  ) => {
    const newAnalytics = {
      ...analytics,
      id: "analytic-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitAnalytics.create({
          data: {
            businessUnitId: unitId,
            date: new Date(analytics.date),
            pageViews: analytics.pageViews || 0,
            uniqueVisitors: analytics.uniqueVisitors || 0,
            sessions: analytics.sessions || 0,
            bounceRate: analytics.bounceRate || 0,
            avgSessionDuration: analytics.avgSessionDuration || 0,
            source: analytics.source || "google_analytics",
          },
        });
      } catch (e) {
        console.error("Prisma error adding analytics", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    if (bu) {
      if (!bu.analytics) bu.analytics = [];
      bu.analytics.push({
        ...newAnalytics,
        date: new Date(analytics.date),
      });
      bu.analytics.sort((a, b) => b.date.getTime() - a.date.getTime());
      return newAnalytics;
    }
    return null;
  },

  deleteBusinessUnitAnalytics: async (analyticsId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.businessUnitAnalytics.delete({
          where: { id: analyticsId },
        });
        return true;
      } catch (e) {
        console.error("Prisma error deleting analytics", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.analytics) {
        const idx = bu.analytics.findIndex((a) => a.id === analyticsId);
        if (idx !== -1) {
          bu.analytics.splice(idx, 1);
          return true;
        }
      }
    }
    return false;
  },

  addBusinessUnitRevenue: async (
    unitId: string,
    revenue: Omit<MockBusinessUnitRevenue, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newRevenue = {
      ...revenue,
      id: "revenue-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitRevenue.create({
          data: {
            businessUnitId: unitId,
            period: revenue.period,
            amount: revenue.amount || 0,
            currency: revenue.currency || "BRL",
            type: revenue.type,
            source: revenue.source,
            notes: revenue.notes || null,
          },
        });
      } catch (e) {
        console.error("Prisma error adding revenue", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    if (bu) {
      if (!bu.revenueData) bu.revenueData = [];
      bu.revenueData.push(newRevenue);
      bu.revenueData.sort((a, b) => b.period.localeCompare(a.period));
      return newRevenue;
    }
    return null;
  },

  deleteBusinessUnitRevenue: async (revenueId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.businessUnitRevenue.delete({
          where: { id: revenueId },
        });
        return true;
      } catch (e) {
        console.error("Prisma error deleting revenue", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.revenueData) {
        const idx = bu.revenueData.findIndex((r) => r.id === revenueId);
        if (idx !== -1) {
          bu.revenueData.splice(idx, 1);
          return true;
        }
      }
    }
    return false;
  },

  /**
   * Fetches the businessUnitId of an item by its ID and type.
   * Returns null when the item does not exist.
   * Used to verify ownership before deletion (IDOR prevention).
   */
  getBusinessUnitItemOwner: async (
    itemId: string,
    type: "tool" | "social" | "analytics" | "revenue",
  ): Promise<string | null> => {
    if (prismaClient && isDbConnected) {
      try {
        let record: { businessUnitId: string } | null = null;
        if (type === "tool") {
          record = await prismaClient.businessUnitTool.findUnique({
            where: { id: itemId },
            select: { businessUnitId: true },
          });
        } else if (type === "social") {
          record = await prismaClient.businessUnitSocialLink.findUnique({
            where: { id: itemId },
            select: { businessUnitId: true },
          });
        } else if (type === "analytics") {
          record = await prismaClient.businessUnitAnalytics.findUnique({
            where: { id: itemId },
            select: { businessUnitId: true },
          });
        } else if (type === "revenue") {
          record = await prismaClient.businessUnitRevenue.findUnique({
            where: { id: itemId },
            select: { businessUnitId: true },
          });
        }
        return record?.businessUnitId ?? null;
      } catch (e) {
        console.error("Prisma error fetching item owner", e);
      }
    }
    // Mock fallback: search all mock business units for the item
    for (const bu of mockBusinessUnits) {
      if (type === "tool" && bu.tools) {
        const found = bu.tools.find((t) => t.id === itemId);
        if (found) return bu.id;
      } else if (type === "social" && bu.socialLinks) {
        const found = bu.socialLinks.find((s) => s.id === itemId);
        if (found) return bu.id;
      } else if (type === "analytics" && bu.analytics) {
        const found = bu.analytics.find((a) => a.id === itemId);
        if (found) return bu.id;
      } else if (type === "revenue" && bu.revenueData) {
        const found = bu.revenueData.find((r) => r.id === itemId);
        if (found) return bu.id;
      }
    }
    return null;
  },

  getBusinessUnitTools: async (unitId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitTool.findMany({
          where: { businessUnitId: unitId },
          orderBy: { order: "asc" },
        });
      } catch (e) {
        console.error("Prisma error getting tools", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    return bu?.tools || [];
  },

  updateBusinessUnitTool: async (
    toolId: string,
    updates: Partial<MockBusinessUnitTool>,
  ) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitTool.update({
          where: { id: toolId },
          data: {
            ...(updates.name ? { name: updates.name } : {}),
            ...(updates.url ? { url: updates.url } : {}),
            ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
            ...(updates.description !== undefined
              ? { description: updates.description }
              : {}),
            ...(updates.category ? { category: updates.category } : {}),
            ...(updates.isExternal !== undefined
              ? { isExternal: updates.isExternal }
              : {}),
            ...(updates.order !== undefined ? { order: updates.order } : {}),
            ...(updates.isActive !== undefined
              ? { isActive: updates.isActive }
              : {}),
          },
        });
      } catch (e) {
        console.error("Prisma error updating tool", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.tools) {
        const idx = bu.tools.findIndex((t) => t.id === toolId);
        if (idx !== -1) {
          bu.tools[idx] = {
            ...bu.tools[idx],
            ...updates,
            updatedAt: new Date(),
          };
          return bu.tools[idx];
        }
      }
    }
    return null;
  },

  getBusinessUnitSocialLinks: async (unitId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitSocialLink.findMany({
          where: { businessUnitId: unitId },
        });
      } catch (e) {
        console.error("Prisma error getting social links", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    return bu?.socialLinks || [];
  },

  updateBusinessUnitSocialLink: async (
    socialId: string,
    updates: Partial<MockBusinessUnitSocialLink>,
  ) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitSocialLink.update({
          where: { id: socialId },
          data: {
            ...(updates.platform ? { platform: updates.platform } : {}),
            ...(updates.url ? { url: updates.url } : {}),
            ...(updates.handle !== undefined ? { handle: updates.handle } : {}),
            ...(updates.followersCount !== undefined
              ? { followersCount: updates.followersCount }
              : {}),
            ...(updates.isActive !== undefined
              ? { isActive: updates.isActive }
              : {}),
          },
        });
      } catch (e) {
        console.error("Prisma error updating social link", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.socialLinks) {
        const idx = bu.socialLinks.findIndex((s) => s.id === socialId);
        if (idx !== -1) {
          bu.socialLinks[idx] = {
            ...bu.socialLinks[idx],
            ...updates,
            updatedAt: new Date(),
          };
          return bu.socialLinks[idx];
        }
      }
    }
    return null;
  },

  getBusinessUnitAnalytics: async (unitId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitAnalytics.findMany({
          where: { businessUnitId: unitId },
          orderBy: { date: "desc" },
        });
      } catch (e) {
        console.error("Prisma error getting analytics", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    return bu?.analytics || [];
  },

  updateBusinessUnitAnalytics: async (
    analyticsId: string,
    updates: Partial<MockBusinessUnitAnalytics>,
  ) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitAnalytics.update({
          where: { id: analyticsId },
          data: {
            ...(updates.date ? { date: new Date(updates.date) } : {}),
            ...(updates.pageViews !== undefined
              ? { pageViews: updates.pageViews }
              : {}),
            ...(updates.uniqueVisitors !== undefined
              ? { uniqueVisitors: updates.uniqueVisitors }
              : {}),
            ...(updates.sessions !== undefined
              ? { sessions: updates.sessions }
              : {}),
            ...(updates.bounceRate !== undefined
              ? { bounceRate: updates.bounceRate }
              : {}),
            ...(updates.avgSessionDuration !== undefined
              ? { avgSessionDuration: updates.avgSessionDuration }
              : {}),
            ...(updates.source ? { source: updates.source } : {}),
          },
        });
      } catch (e) {
        console.error("Prisma error updating analytics", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.analytics) {
        const idx = bu.analytics.findIndex((a) => a.id === analyticsId);
        if (idx !== -1) {
          bu.analytics[idx] = {
            ...bu.analytics[idx],
            ...updates,
            ...(updates.date ? { date: new Date(updates.date) } : {}),
          };
          return bu.analytics[idx];
        }
      }
    }
    return null;
  },

  getBusinessUnitMetaData: async (unitId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitMetaData.findMany({
          where: { businessUnitId: unitId },
          orderBy: { date: "desc" },
        });
      } catch (e) {
        console.error("Prisma error getting metadata", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    return bu?.metaData || [];
  },

  addBusinessUnitMetaData: async (
    unitId: string,
    meta: Omit<MockBusinessUnitMetaData, "id" | "createdAt">,
  ) => {
    const newMeta = {
      ...meta,
      id: "meta-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitMetaData.create({
          data: {
            businessUnitId: unitId,
            date: new Date(meta.date),
            platform: meta.platform,
            followersCount: meta.followersCount || 0,
            followingCount: meta.followingCount || 0,
            postsCount: meta.postsCount || 0,
            engagementRate: meta.engagementRate || 0,
            reach: meta.reach || 0,
            impressions: meta.impressions || 0,
          },
        });
      } catch (e) {
        console.error("Prisma error adding metadata", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    if (bu) {
      if (!bu.metaData) bu.metaData = [];
      bu.metaData.push({
        ...newMeta,
        date: new Date(meta.date),
      });
      return newMeta;
    }
    return null;
  },

  updateBusinessUnitMetaData: async (
    metaId: string,
    updates: Partial<MockBusinessUnitMetaData>,
  ) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitMetaData.update({
          where: { id: metaId },
          data: {
            ...(updates.date ? { date: new Date(updates.date) } : {}),
            ...(updates.platform ? { platform: updates.platform } : {}),
            ...(updates.followersCount !== undefined
              ? { followersCount: updates.followersCount }
              : {}),
            ...(updates.followingCount !== undefined
              ? { followingCount: updates.followingCount }
              : {}),
            ...(updates.postsCount !== undefined
              ? { postsCount: updates.postsCount }
              : {}),
            ...(updates.engagementRate !== undefined
              ? { engagementRate: updates.engagementRate }
              : {}),
            ...(updates.reach !== undefined ? { reach: updates.reach } : {}),
            ...(updates.impressions !== undefined
              ? { impressions: updates.impressions }
              : {}),
          },
        });
      } catch (e) {
        console.error("Prisma error updating metadata", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.metaData) {
        const idx = bu.metaData.findIndex((m) => m.id === metaId);
        if (idx !== -1) {
          bu.metaData[idx] = {
            ...bu.metaData[idx],
            ...updates,
            ...(updates.date ? { date: new Date(updates.date) } : {}),
          };
          return bu.metaData[idx];
        }
      }
    }
    return null;
  },

  deleteBusinessUnitMetaData: async (metaId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.businessUnitMetaData.delete({
          where: { id: metaId },
        });
        return true;
      } catch (e) {
        console.error("Prisma error deleting metadata", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.metaData) {
        const idx = bu.metaData.findIndex((m) => m.id === metaId);
        if (idx !== -1) {
          bu.metaData.splice(idx, 1);
          return true;
        }
      }
    }
    return false;
  },

  getBusinessUnitRevenue: async (unitId: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitRevenue.findMany({
          where: { businessUnitId: unitId },
          orderBy: { period: "desc" },
        });
      } catch (e) {
        console.error("Prisma error getting revenue", e);
      }
    }
    const bu = mockBusinessUnits.find((u) => u.id === unitId);
    return bu?.revenueData || [];
  },

  updateBusinessUnitRevenue: async (
    revenueId: string,
    updates: Partial<MockBusinessUnitRevenue>,
  ) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.businessUnitRevenue.update({
          where: { id: revenueId },
          data: {
            ...(updates.period ? { period: updates.period } : {}),
            ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
            ...(updates.currency ? { currency: updates.currency } : {}),
            ...(updates.type ? { type: updates.type } : {}),
            ...(updates.source ? { source: updates.source } : {}),
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
          },
        });
      } catch (e) {
        console.error("Prisma error updating revenue", e);
      }
    }
    for (const bu of mockBusinessUnits) {
      if (bu.revenueData) {
        const idx = bu.revenueData.findIndex((r) => r.id === revenueId);
        if (idx !== -1) {
          bu.revenueData[idx] = {
            ...bu.revenueData[idx],
            ...updates,
            updatedAt: new Date(),
          };
          return bu.revenueData[idx];
        }
      }
    }
    return null;
  },

  getCompanies: async () => {
    return mockCompanies;
  },

  addCompany: async (
    company: Omit<MockCompany, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newCompany: MockCompany = {
      ...company,
      id: "comp-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCompanies.push(newCompany);
    return newCompany;
  },

  createCompany: async (
    company: Omit<MockCompany, "id" | "createdAt" | "updatedAt">,
  ) => {
    return dbSim.addCompany(company);
  },

  updateCompany: async (id: string, updates: Partial<MockCompany>) => {
    const idx = mockCompanies.findIndex((c) => c.id === id);
    if (idx !== -1) {
      mockCompanies[idx] = {
        ...mockCompanies[idx],
        ...updates,
        updatedAt: new Date(),
      };
      return mockCompanies[idx];
    }
    return null;
  },

  deleteCompany: async (id: string) => {
    const idx = mockCompanies.findIndex((c) => c.id === id);
    if (idx !== -1) {
      mockCompanies.splice(idx, 1);
      return true;
    }
    return false;
  },

  syncAllBusinessUnits: async () => {
    let units;
    if (prismaClient && isDbConnected) {
      try {
        units = await prismaClient.businessUnit.findMany();
      } catch (e) {
        console.error("Error fetching business units for sync all", e);
      }
    }
    if (!units) {
      units = mockBusinessUnits;
    }
    for (const bu of units) {
      await dbSim.syncBusinessUnitData(bu.slug);
    }
    return true;
  },

  createUser: async (user: {
    name: string;
    email: string;
    role: string;
    hierarchyLevel: number;
    company: Company;
    password?: string;
  }) => {
    return dbSim.addUser(user);
  },

  deleteUser: async (id: string) => {
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.user.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting user, falling back", e);
      }
    }
    const idx = mockUsers.findIndex((u) => u.id === id);
    if (idx !== -1) {
      mockUsers.splice(idx, 1);
      return true;
    }
    return false;
  },

  updateUserStatus: async (id: string, status: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.user.update({
          where: { id },
          data: { status },
        });
      } catch (e) {
        console.error("Prisma error updating user status", e);
      }
    }
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      user.status = status;
      return user;
    }
    return null;
  },

  updateUserRole: async (id: string, role: string) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.user.update({
          where: { id },
          data: { role },
        });
      } catch (e) {
        console.error("Prisma error updating user role", e);
      }
    }
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      user.role = role;
      return user;
    }
    return null;
  },

  createRole: async (role: {
    name: string;
    displayName: string;
    hierarchyLevel: number;
  }) => {
    return dbSim.addRole(role);
  },

  createPanel: async (panel: {
    name: string;
    description?: string;
    url: string;
    icon: string;
    category: string;
    minRole: string;
    minHierarchy: number;
    isActive?: boolean;
    companySlug?: string | null;
  }) => {
    const newPanel = {
      ...panel,
      id: "panel-" + Math.random().toString(36).substr(2, 9),
      description: panel.description || "",
      isActive: panel.isActive !== undefined ? panel.isActive : true,
      companySlug: panel.companySlug || null,
    };
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.systemPanel.create({
          data: {
            id: newPanel.id,
            name: newPanel.name,
            description: newPanel.description,
            url: newPanel.url,
            icon: newPanel.icon,
            category: newPanel.category,
            minRole: newPanel.minRole,
            minHierarchy: newPanel.minHierarchy,
            isActive: newPanel.isActive,
            companySlug: newPanel.companySlug || null,
          },
        });
      } catch (e) {
        console.error("Prisma error creating panel, falling back", e);
      }
    }
    mockPanels.push(newPanel);
    return newPanel;
  },

  updatePanel: async (
    id: string,
    updates: {
      name?: string;
      description?: string;
      url?: string;
      icon?: string;
      category?: string;
      minRole?: string;
      minHierarchy?: number;
      isActive?: boolean;
      companySlug?: string | null;
    },
  ) => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.systemPanel.update({
          where: { id },
          data: {
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.description !== undefined
              ? { description: updates.description }
              : {}),
            ...(updates.url !== undefined ? { url: updates.url } : {}),
            ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
            ...(updates.category !== undefined
              ? { category: updates.category }
              : {}),
            ...(updates.minRole !== undefined
              ? { minRole: updates.minRole }
              : {}),
            ...(updates.minHierarchy !== undefined
              ? { minHierarchy: updates.minHierarchy }
              : {}),
            ...(updates.isActive !== undefined
              ? { isActive: updates.isActive }
              : {}),
            ...(updates.companySlug !== undefined
              ? { companySlug: updates.companySlug }
              : {}),
          },
        });
      } catch (e) {
        console.error("Prisma error updating panel, falling back", e);
      }
    }
    const panel = mockPanels.find((p) => p.id === id);
    if (panel) {
      if (updates.name !== undefined) panel.name = updates.name;
      if (updates.description !== undefined)
        panel.description = updates.description;
      if (updates.url !== undefined) panel.url = updates.url;
      if (updates.icon !== undefined) panel.icon = updates.icon;
      if (updates.category !== undefined) panel.category = updates.category;
      if (updates.minRole !== undefined) panel.minRole = updates.minRole;
      if (updates.minHierarchy !== undefined)
        panel.minHierarchy = updates.minHierarchy;
      if (updates.isActive !== undefined) panel.isActive = updates.isActive;
      if (updates.companySlug !== undefined)
        panel.companySlug = updates.companySlug;
      return panel;
    }
    return null;
  },

  deletePanel: async (id: string) => {
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.systemPanel.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting panel, falling back", e);
      }
    }
    const idx = mockPanels.findIndex((p) => p.id === id);
    if (idx !== -1) {
      mockPanels.splice(idx, 1);
      return true;
    }
    return false;
  },

  deleteDocument: async (id: string) => {
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.document.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("Prisma error deleting document, falling back", e);
      }
    }
    const idx = mockDocuments.findIndex((d) => d.id === id);
    if (idx !== -1) {
      mockDocuments.splice(idx, 1);
      return true;
    }
    return false;
  },

  createAnnouncement: async (
    ann: Omit<MockAnnouncement, "id" | "createdAt" | "updatedAt">,
  ) => {
    return dbSim.addAnnouncement(ann);
  },

  markAnnouncementAsRead: async (announcementId: string, userId: string) => {
    return dbSim.markAnnouncementRead(announcementId, userId);
  },

  getAuditLogs: async (
    userLevel?: number,
    userCompany?: Company,
  ) => {
    return dbSim.getLogs(userLevel, userCompany);
  },

  createBusinessUnit: async (
    bu: Omit<MockBusinessUnit, "id" | "createdAt" | "updatedAt">,
  ) => {
    return dbSim.addBusinessUnit(bu);
  },

  getLevels: async () => {
    return mockLevels.sort((a, b) => a.level - b.level);
  },

  createLevel: async (level: { level: number; name: string }) => {
    const newLvl: MockLevelConfig = {
      id: "lvl-" + Math.random().toString(36).substr(2, 9),
      level: level.level,
      name: level.name,
      createdAt: new Date(),
    };
    mockLevels.push(newLvl);
    return newLvl;
  },

  deleteLevel: async (id: string) => {
    const idx = mockLevels.findIndex((l) => l.id === id);
    if (idx !== -1) {
      mockLevels.splice(idx, 1);
      return true;
    }
    return false;
  },

  getMenuPermissions: async () => {
    return mockMenuPermissions;
  },

  updateMenuPermission: async (href: string, minLevel: number) => {
    const permission = mockMenuPermissions.find((p) => p.href === href);
    if (permission) {
      permission.minLevel = minLevel;
      return permission;
    }
    return null;
  },

  // Account Lockout
  checkAccountLockout: async (email: string): Promise<{ locked: boolean; lockedUntil?: Date }> => {
    if (prismaClient && isDbConnected) {
      try {
        const user = await prismaClient.user.findUnique({
          where: { email },
          select: { failedLoginAttempts: true, lockedUntil: true },
        });
        if (user) {
          const now = new Date();
          if (user.lockedUntil && user.lockedUntil > now) {
            return { locked: true, lockedUntil: user.lockedUntil };
          }
        }
        return { locked: false };
      } catch (e) {
        console.error("Prisma error checking lockout, falling back", e);
      }
    }
    const state = lockoutState.get(email.toLowerCase());
    const now = new Date();
    if (state && state.lockedUntil && state.lockedUntil > now) {
      return { locked: true, lockedUntil: state.lockedUntil };
    }
    return { locked: false };
  },

  recordFailedLoginAttempt: async (email: string): Promise<{ locked: boolean; lockedUntil?: Date }> => {
    const normalizedEmail = email.toLowerCase();
    if (prismaClient && isDbConnected) {
      try {
        const user = await prismaClient.user.findUnique({
          where: { email: normalizedEmail },
          select: { failedLoginAttempts: true, lockedUntil: true },
        });
        if (user) {
          const newAttempts = user.failedLoginAttempts + 1;
          let lockedUntil: Date | null = null;
          if (newAttempts >= LOCKOUT_THRESHOLD) {
            lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
          }
          await prismaClient.user.update({
            where: { email: normalizedEmail },
            data: {
              failedLoginAttempts: newAttempts,
              ...(lockedUntil ? { lockedUntil } : {}),
            },
          });
          return { locked: !!lockedUntil, lockedUntil: lockedUntil || undefined };
        }
      } catch (e) {
        console.error("Prisma error recording failed attempt, falling back", e);
      }
    }
    const state = lockoutState.get(normalizedEmail) || { attempts: 0 };
    state.attempts += 1;
    if (state.attempts >= LOCKOUT_THRESHOLD) {
      state.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }
    lockoutState.set(normalizedEmail, state);
    return { locked: !!state.lockedUntil, lockedUntil: state.lockedUntil };
  },

  resetFailedLoginAttempts: async (email: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    if (prismaClient && isDbConnected) {
      try {
        await prismaClient.user.update({
          where: { email: normalizedEmail },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
        return;
      } catch (e) {
        console.error("Prisma error resetting failed attempts, falling back", e);
      }
    }
    lockoutState.delete(normalizedEmail);
  },

  // System Config (key-value store)
  getSystemConfig: async (key: string): Promise<string | null> => {
    if (prismaClient && isDbConnected) {
      try {
        const config = await prismaClient.systemConfig.findUnique({
          where: { key },
        });
        return config?.value ?? null;
      } catch (e) {
        console.error("Prisma error fetching system config, falling back", e);
      }
    }
    const mockConfigStore = globalThis.__mockSystemConfig ?? {};
    return mockConfigStore[key] ?? null;
  },

  isMfaEnabled: async (): Promise<boolean> => {
    const value = await dbSim.getSystemConfig("mfaEnabled");
    return value === "true";
  },

  // User MFA
  getUserMfa: async (userId: string): Promise<MockUserMfa | null> => {
    if (prismaClient && isDbConnected) {
      try {
        const mfa = await prismaClient.userMfa.findUnique({
          where: { userId },
        });
        if (mfa) {
          return {
            id: mfa.id,
            userId: mfa.userId,
            secret: mfa.secret,
            enabled: mfa.enabled,
            createdAt: mfa.createdAt,
            updatedAt: mfa.updatedAt,
          };
        }
        return null;
      } catch (e) {
        console.error("Prisma error fetching user MFA, falling back", e);
      }
    }
    return mockMfaUsers.find((m) => m.userId === userId) ?? null;
  },

  setUserMfa: async (userId: string, secret: string, enabled: boolean): Promise<MockUserMfa> => {
    if (prismaClient && isDbConnected) {
      try {
        const existing = await prismaClient.userMfa.findUnique({
          where: { userId },
        });
        if (existing) {
          const updated = await prismaClient.userMfa.update({
            where: { userId },
            data: { secret, enabled },
          });
          return {
            id: updated.id,
            userId: updated.userId,
            secret: updated.secret,
            enabled: updated.enabled,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          };
        }
        const created = await prismaClient.userMfa.create({
          data: { userId, secret, enabled },
        });
        return {
          id: created.id,
          userId: created.userId,
          secret: created.secret,
          enabled: created.enabled,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (e) {
        console.error("Prisma error setting user MFA, falling back", e);
      }
    }
    const existing = mockMfaUsers.find((m) => m.userId === userId);
    if (existing) {
      existing.secret = secret;
      existing.enabled = enabled;
      existing.updatedAt = new Date();
      return existing;
    }
    const newMfa: MockUserMfa = {
      id: "mfa-" + Math.random().toString(36).substr(2, 9),
      userId,
      secret,
      enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockMfaUsers.push(newMfa);
    return newMfa;
  },
};

// Mock Business Units data
const mockBusinessUnits: MockBusinessUnit[] = globalThis.__mockBusinessUnits ?? (globalThis.__mockBusinessUnits = [
  {
    id: "bu-1",
    name: "Borgo del Vino",
    slug: "borgo-del-vino",
    company: Company.BORGO,
    description:
      "Primeiro condomínio vinícola da Região Serrana e Sudeste. Inspirado nas vilas da Toscana, integrando vinhedos próprios, hotel boutique, spa, enoteca e restaurante em um cenário espetacular.",
    logo: "",
    coverImage: "",
    address: "Estrada de Areal, Km 12 - Areal, RJ",
    phone: "(24) 2232-0024",
    email: "contato@borgodelvino.com.br",
    website: "https://borgodelvino.com.br",
    isActive: true,
    order: 1,
    showOnHome: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    tools: [
      {
        id: "tool-mock-1",
        businessUnitId: "bu-1",
        name: "Borgo del Vino - Parceiros",
        url: "https://borgodelvino.com.br/parceiros",
        icon: "Wine",
        description:
          "Portal e area de parceiros do empreendimento Borgo del Vino.",
        category: "CRM",
        isExternal: true,
        order: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tool-mock-2",
        businessUnitId: "bu-1",
        name: "Borgo del Vino - Painel Admin",
        url: "https://borgodelvino.com.br/Adminborgo",
        icon: "Wine",
        description:
          "Painel administrativo para gestao interna do Borgo del Vino.",
        category: "ERP",
        isExternal: true,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    socialLinks: [],
    analytics: [],
    metaData: [],
    revenueData: [],
  },
  {
    id: "bu-2",
    name: "Seven Itaipava",
    slug: "seven-itaipava",
    company: Company.AZUL,
    description:
      "Empreendimento residencial de altíssimo padrão em Itaipava. Design contemporâneo, arquitetura integrada à natureza e sofisticação em uma das áreas mais valorizadas da Região Serrana.",
    logo: "",
    coverImage: "",
    address: "Estrada União e Indústria - Itaipava, Petrópolis, RJ",
    phone: "(24) 2232-0024",
    email: "contato@azulincorporacoes.com.br",
    website: "https://azulincorporacoes.com.br",
    isActive: true,
    order: 2,
    showOnHome: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    tools: [
      {
        id: "tool-mock-3",
        businessUnitId: "bu-2",
        name: "CRM - Grupo Azul",
        url: "https://azulcrm-dykanzmd.manus.space",
        icon: "Building2",
        description:
          "Plataforma de CRM e gestao comercial do Grupo Azul Incorporacoes.",
        category: "CRM",
        isExternal: true,
        order: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tool-mock-4",
        businessUnitId: "bu-2",
        name: "Formulario de Parcerias Azul",
        url: "https://formulario-azul.vercel.app/admin",
        icon: "Notebook",
        description:
          "Painel administrativo de cadastros e parcerias da Azul Incorporacoes.",
        category: "ERP",
        isExternal: true,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    socialLinks: [],
    analytics: [],
    metaData: [],
    revenueData: [],
  },
  {
    id: "bu-3",
    name: "Maple Bear Itaipava",
    slug: "maple-bear-itaipava",
    company: Company.MAPLE_BEAR,
    description:
      "Unidade da rede de ensino bilíngue canadense Maple Bear em Itaipava, administrada pela holding educacional do grupo (Azul Canadá). Metodologia activa focada no desenvolvimento integral.",
    logo: "",
    coverImage: "",
    address: "Estrada União e Indústria, Itaipava - Petrópolis, RJ",
    phone: "(24) 2232-0024",
    email: "itaipava@maplebear.com.br",
    website: "https://maplebear.com.br",
    isActive: true,
    order: 3,
    showOnHome: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    tools: [
      {
        id: "tool-mock-5",
        businessUnitId: "bu-3",
        name: "Maple Bear - Painel Admin",
        url: "https://formulario-maplebear.vercel.app/admin",
        icon: "Notebook",
        description:
          "Painel administrativo de formularias e cadastros da Maple Bear.",
        category: "ERP",
        isExternal: true,
        order: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    socialLinks: [],
    analytics: [],
    metaData: [],
    revenueData: [],
  },
  {
    id: "bu-4",
    name: "Ville Saint Germain",
    slug: "ville-saint-germain",
    company: Company.AZUL,
    description:
      "Condomínio residencial pronto para morar no bairro Valparaíso, Petrópolis. Townhouses e casas neoclássicas com completa infraestrutura de lazer, segurança e requinte.",
    logo: "",
    coverImage: "",
    address: "Rua Gonçalves Dias - Valparaíso, Petrópolis, RJ",
    phone: "(24) 2232-0024",
    email: "vendas@azulincorporacoes.com.br",
    website: "https://azulincorporacoes.com.br",
    isActive: true,
    order: 4,
    showOnHome: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    tools: [
      {
        id: "tool-mock-6",
        businessUnitId: "bu-4",
        name: "CRM - Grupo Azul",
        url: "https://azulcrm-dykanzmd.manus.space",
        icon: "Building2",
        description:
          "Plataforma de CRM e gestao comercial do Grupo Azul Incorporacoes.",
        category: "CRM",
        isExternal: true,
        order: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tool-mock-7",
        businessUnitId: "bu-4",
        name: "Formulario de Parcerias Azul",
        url: "https://formulario-azul.vercel.app/admin",
        icon: "Notebook",
        description:
          "Painel administrativo de cadastros e parcerias da Azul Incorporacoes.",
        category: "ERP",
        isExternal: true,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    socialLinks: [],
    analytics: [],
    metaData: [],
    revenueData: [],
  },
  {
    id: "bu-5",
    name: "Unidade Agregadora Central Azul",
    slug: "central-azul",
    company: Company.CENTRAL,
    description:
      "Unidade agregadora Central Azul responsavel pela gestao integrada do grupo.",
    logo: "",
    coverImage: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    isActive: true,
    order: 5,
    showOnHome: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tools: [],
    socialLinks: [],
    analytics: [],
    metaData: [],
    revenueData: [],
  },
]);

// ============================================
// UNIFIED DATABASE EXPORT
// ============================================
// This is the single source of truth for database access.
// It automatically uses Prisma when connected, falls back to mock in development.
// In production without DATABASE_URL, it will throw an error.
// ============================================

export const db = {
  // Users
  getUsers: dbSim.getUsers,
  getUserByEmail: dbSim.getUserByEmail,
  getUserById: dbSim.getUserById,
  updateUserHierarchy: dbSim.updateUserHierarchy,
  updateUserStatus: dbSim.updateUserStatus,
  updateUserRole: dbSim.updateUserRole,
  createUser: dbSim.createUser,
  deleteUser: dbSim.deleteUser,
  updateUserProfile: dbSim.updateUserProfile,

  // Roles
  getRoles: dbSim.getRoles,
  createRole: dbSim.createRole,
  updateRole: dbSim.updateRole,
  deleteRole: dbSim.deleteRole,

  // Panels/Tools
  getPanels: dbSim.getPanels,
  createPanel: dbSim.createPanel,
  updatePanel: dbSim.updatePanel,
  deletePanel: dbSim.deletePanel,

  // Documents
  getDocuments: dbSim.getDocuments,
  addDocument: dbSim.addDocument,
  deleteDocument: dbSim.deleteDocument,

  // Announcements
  getAnnouncements: dbSim.getAnnouncements,
  getAnnouncementReadsByUser: dbSim.getAnnouncementReadsByUser,
  createAnnouncement: dbSim.createAnnouncement,
  updateAnnouncement: dbSim.updateAnnouncement,
  deleteAnnouncement: dbSim.deleteAnnouncement,
  markAnnouncementAsRead: dbSim.markAnnouncementAsRead,

  // Audit Logs
  getAuditLogs: dbSim.getAuditLogs,
  addLog: dbSim.addLog,

  // Business Units
  getBusinessUnitsForHome: dbSim.getBusinessUnitsForHome,
  getBusinessUnits: dbSim.getBusinessUnits,
  getBusinessUnitBySlug: dbSim.getBusinessUnitBySlug,
  getBusinessUnitItemOwner: dbSim.getBusinessUnitItemOwner,
  createBusinessUnit: dbSim.createBusinessUnit,
  updateBusinessUnit: dbSim.updateBusinessUnit,
  deleteBusinessUnit: dbSim.deleteBusinessUnit,

  // Business Unit Tools
  getBusinessUnitTools: dbSim.getBusinessUnitTools,
  addBusinessUnitTool: dbSim.addBusinessUnitTool,
  updateBusinessUnitTool: dbSim.updateBusinessUnitTool,
  deleteBusinessUnitTool: dbSim.deleteBusinessUnitTool,

  // Business Unit Social Links
  getBusinessUnitSocialLinks: dbSim.getBusinessUnitSocialLinks,
  addBusinessUnitSocialLink: dbSim.addBusinessUnitSocialLink,
  updateBusinessUnitSocialLink: dbSim.updateBusinessUnitSocialLink,
  deleteBusinessUnitSocialLink: dbSim.deleteBusinessUnitSocialLink,

  // Business Unit Analytics
  getBusinessUnitAnalytics: dbSim.getBusinessUnitAnalytics,
  addBusinessUnitAnalytics: dbSim.addBusinessUnitAnalytics,
  updateBusinessUnitAnalytics: dbSim.updateBusinessUnitAnalytics,
  deleteBusinessUnitAnalytics: dbSim.deleteBusinessUnitAnalytics,

  // Business Unit Meta Data
  getBusinessUnitMetaData: dbSim.getBusinessUnitMetaData,
  addBusinessUnitMetaData: dbSim.addBusinessUnitMetaData,
  updateBusinessUnitMetaData: dbSim.updateBusinessUnitMetaData,
  deleteBusinessUnitMetaData: dbSim.deleteBusinessUnitMetaData,

  // Business Unit Revenue
  getBusinessUnitRevenue: dbSim.getBusinessUnitRevenue,
  addBusinessUnitRevenue: dbSim.addBusinessUnitRevenue,
  updateBusinessUnitRevenue: dbSim.updateBusinessUnitRevenue,
  deleteBusinessUnitRevenue: dbSim.deleteBusinessUnitRevenue,

  // Company Config
  getCompanies: dbSim.getCompanies,
  createCompany: dbSim.createCompany,
  updateCompany: dbSim.updateCompany,
  deleteCompany: dbSim.deleteCompany,

  // Sync
  syncBusinessUnitData: dbSim.syncBusinessUnitData,
  syncAllBusinessUnits: dbSim.syncAllBusinessUnits,

  // Custom Levels
  getLevels: dbSim.getLevels,
  createLevel: dbSim.createLevel,
  deleteLevel: dbSim.deleteLevel,

  // Menu Permissions
  getMenuPermissions: dbSim.getMenuPermissions,
  updateMenuPermission: dbSim.updateMenuPermission,

  // Account Lockout
  checkAccountLockout: dbSim.checkAccountLockout,
  recordFailedLoginAttempt: dbSim.recordFailedLoginAttempt,
  resetFailedLoginAttempts: dbSim.resetFailedLoginAttempts,

  // System Config
  getSystemConfig: dbSim.getSystemConfig,
  isMfaEnabled: dbSim.isMfaEnabled,

  // User MFA
  getUserMfa: dbSim.getUserMfa,
  setUserMfa: dbSim.setUserMfa,
};

// Type export for consumers
export type Database = typeof db;
