import { PrismaClient, Company } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

// Mock database store for fallback
export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string;
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
  category: Company;
  minRole: string;
  minHierarchy: number;
  isActive: boolean;
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

// Initial mock data
const mockRoles: MockRoleConfig[] = [
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
];

const mockUsers: MockUser[] = [
  {
    id: "user-director",
    name: "Diretor Grupo Azul",
    email: "diretor@grupoazul.com.br",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    role: "ADMIN",
    hierarchyLevel: 1,
    company: Company.CENTRAL,
    status: "ACTIVE",
    createdAt: new Date(),
  },
  {
    id: "user-admin",
    name: "Administrador Central",
    email: "admin@grupoazul.com.br",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
    role: "ADMIN",
    hierarchyLevel: 1,
    company: Company.CENTRAL,
    status: "ACTIVE",
    createdAt: new Date(),
  },
  {
    id: "user-borgo",
    name: "Gerente Borgo del Vin",
    email: "gerente.borgo@borgodelvin.com.br",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    role: "COORDINATOR",
    hierarchyLevel: 2,
    company: Company.BORGO,
    status: "ACTIVE",
    createdAt: new Date(),
  },
  {
    id: "user-maple",
    name: "Coordenador Maple Bear",
    email: "coordenador.maple@maplebear.com.br",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    role: "COORDINATOR",
    hierarchyLevel: 2,
    company: Company.MAPLE_BEAR,
    status: "ACTIVE",
    createdAt: new Date(),
  },
  {
    id: "user-viewer",
    name: "Operador Azul",
    email: "operador.azul@azulinc.com.br",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120",
    role: "VIEWER",
    hierarchyLevel: 3,
    company: Company.AZUL,
    status: "ACTIVE",
    createdAt: new Date(),
  },
];

const mockPanels: MockSystemPanel[] = [
  {
    id: "panel-1",
    name: "CRM - Grupo Azul",
    description:
      "Plataforma de CRM e gestao comercial do Grupo Azul Incorporacoes.",
    url: "https://azulcrm-dykanzmd.manus.space",
    icon: "Building2",
    category: Company.AZUL,
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
    category: Company.BORGO,
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
    category: Company.BORGO,
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
    category: Company.MAPLE_BEAR,
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
    category: Company.CENTRAL,
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
    category: Company.AZUL,
    minRole: "COORDINATOR",
    minHierarchy: 2,
    isActive: true,
  },
];

const mockDocuments: MockDocument[] = [
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
];

const mockLogs: MockAuditLog[] = [
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
];

// Fase 1 - Mock Announcements
const mockAnnouncements: MockAnnouncement[] = [
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
];

const mockAnnouncementReads: MockAnnouncementRead[] = [];

// Persistent state handlers in memory (simulating a database server)
// We will expose database simulation functions so that even if MySQL is not connected,
// roles, logs, and files are updated in real-time on the server.
export const dbSim = {
  getUsers: async () => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.user.findMany({
          orderBy: { createdAt: "desc" },
        });
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    return mockUsers;
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

  addUser: async (user: {
    name: string;
    email: string;
    role: string;
    hierarchyLevel: number;
    company: Company;
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
        return await prismaClient.user.create({
          data: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            image: newUser.image,
            role: newUser.role,
            hierarchyLevel: newUser.hierarchyLevel,
            company: newUser.company,
            status: newUser.status,
          },
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
        let dbPanels = await prismaClient.systemPanel.findMany();

        // Find panels in mockPanels that are missing from the database by ID or URL
        const missingPanels = mockPanels.filter(
          (mockP) =>
            !dbPanels.some(
              (dbP) => dbP.id === mockP.id || dbP.url === mockP.url,
            ),
        );

        if (missingPanels.length > 0) {
          for (const p of missingPanels) {
            await prismaClient.systemPanel.create({
              data: {
                id: p.id,
                name: p.name,
                description: p.description,
                url: p.url,
                icon: p.icon,
                category: p.category,
                minRole: p.minRole,
                minHierarchy: p.minHierarchy,
                isActive: p.isActive,
              },
            });
          }
          dbPanels = await prismaClient.systemPanel.findMany();
        }

        // Delete panels from the database that are no longer in mockPanels
        const extraPanels = dbPanels.filter(
          (dbP) =>
            !mockPanels.some(
              (mockP) => mockP.id === dbP.id || mockP.url === dbP.url,
            ),
        );

        if (extraPanels.length > 0) {
          for (const p of extraPanels) {
            await prismaClient.systemPanel.delete({
              where: { id: p.id },
            });
          }
          dbPanels = await prismaClient.systemPanel.findMany();
        }

        return dbPanels;
      } catch (e) {
        console.error("Prisma error, falling back", e);
      }
    }
    return mockPanels;
  },

  getDocuments: async () => {
    if (prismaClient && isDbConnected) {
      try {
        const dbDocs = await prismaClient.document.findMany({
          include: { uploadedBy: true },
          orderBy: { createdAt: "desc" },
        });
        return dbDocs.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description || "",
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
    return mockDocuments;
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

  getLogs: async () => {
    if (prismaClient && isDbConnected) {
      try {
        const dbLogs = await prismaClient.auditLog.findMany({
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
    return mockLogs;
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
        const updated = await prismaClient.roleConfig.update({
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
          await prismaClient.user.updateMany({
            where: { role: origRole.name },
            data: { role: nameUpper },
          });
          // Update system panels
          await prismaClient.systemPanel.updateMany({
            where: { minRole: origRole.name },
            data: { minRole: nameUpper },
          });
        }
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
          // Reassign users of this role to VIEWER (or another base role) before deletion
          await prismaClient.user.updateMany({
            where: { role: origRole.name },
            data: { role: "VIEWER" },
          });
          // Reassign system panels
          await prismaClient.systemPanel.updateMany({
            where: { minRole: origRole.name },
            data: { minRole: "VIEWER" },
          });

          await prismaClient.roleConfig.delete({ where: { id } });
          return true;
        }
      } catch (e) {
        console.error("Prisma error deleting role, falling back", e);
      }
    }
    const index = mockRoles.findIndex((r) => r.id === id);
    if (index !== -1) {
      const deletedName = mockRoles[index].name;
      mockRoles.splice(index, 1);
      // Reassign mock users
      for (const u of mockUsers) {
        if (u.role === deletedName) u.role = "VIEWER";
      }
      // Reassign mock panels
      for (const p of mockPanels) {
        if (p.minRole === deletedName) p.minRole = "VIEWER";
      }
      return true;
    }
    return false;
  },

  // Fase 1 - Announcements
  getAnnouncements: async () => {
    if (prismaClient && isDbConnected) {
      try {
        return await prismaClient.announcement.findMany({
          orderBy: { createdAt: "desc" },
        });
      } catch (e) {
        console.error("Prisma error fetching announcements, falling back", e);
      }
    }
    return mockAnnouncements;
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
};

// Mock Business Units data
const mockBusinessUnits: MockBusinessUnit[] = [
  {
    id: "bu-1",
    name: "Borgo del Vino",
    slug: "borgo-del-vino",
    company: Company.BORGO,
    description: "Primeiro condomínio vinícola da Região Serrana e Sudeste. Inspirado nas vilas da Toscana, integrando vinhedos próprios, hotel boutique, spa, enoteca e restaurante em um cenário espetacular.",
    logo: "",
    coverImage: "",
    address: "Estrada de Areal, Km 12 - Areal, RJ",
    phone: "(24) 2232-0024",
    email: "contato@borgodelvino.com.br",
    website: "https://borgodelvino.com.br",
    isActive: true,
    order: 1,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    tools: [],
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
    description: "Empreendimento residencial de altíssimo padrão em Itaipava. Design contemporâneo, arquitetura integrada à natureza e sofisticação em uma das áreas mais valorizadas da Região Serrana.",
    logo: "",
    coverImage: "",
    address: "Estrada União e Indústria - Itaipava, Petrópolis, RJ",
    phone: "(24) 2232-0024",
    email: "contato@azulincorporacoes.com.br",
    website: "https://azulincorporacoes.com.br",
    isActive: true,
    order: 2,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    tools: [],
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
    description: "Unidade da rede de ensino bilíngue canadense Maple Bear em Itaipava, administrada pela holding educacional do grupo (Azul Canadá). Metodologia ativa focada no desenvolvimento integral.",
    logo: "",
    coverImage: "",
    address: "Estrada União e Indústria, Itaipava - Petrópolis, RJ",
    phone: "(24) 2232-0024",
    email: "itaipava@maplebear.com.br",
    website: "https://maplebear.com.br",
    isActive: true,
    order: 3,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    tools: [],
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
    description: "Condomínio residencial pronto para morar no bairro Valparaíso, Petrópolis. Townhouses e casas neoclássicas com completa infraestrutura de lazer, segurança e requinte.",
    logo: "",
    coverImage: "",
    address: "Rua Gonçalves Dias - Valparaíso, Petrópolis, RJ",
    phone: "(24) 2232-0024",
    email: "vendas@azulincorporacoes.com.br",
    website: "https://azulincorporacoes.com.br",
    isActive: true,
    order: 4,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    tools: [],
    socialLinks: [],
    analytics: [],
    metaData: [],
    revenueData: [],
  },
];
