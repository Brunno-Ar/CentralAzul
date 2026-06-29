// Shared Zod validation schemas for all API routes
// Centralized validation layer for consistency and maintainability

import { z } from "zod";
import { Company } from "@prisma/client";

// ============================================
// COMMON SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, "Slug é obrigatório"),
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
  callbackUrl: z.string().url().optional(),
  csrfToken: z.string().min(1, "CSRF token é obrigatório"),
});

export const refreshRoleSchema = z.object({
  userId: z.string().min(1, "User ID é obrigatório"),
});

// ============================================
// USER SCHEMAS
// ============================================

export const userRoleEnum = z.string().min(1, "Cargo e obrigatorio");
export const hierarchyLevelSchema = z.number().int().min(1);
export const userStatusEnum = z.enum(["ACTIVE", "INACTIVE", "PENDING"]);

export const updateUserSchema = z.object({
  userId: z.string().min(1, "User ID e obrigatorio"),
  role: userRoleEnum,
  hierarchyLevel: hierarchyLevelSchema.optional(),
  status: userStatusEnum.optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email invalido"),
  role: userRoleEnum.default("VIEWER"),
  hierarchyLevel: hierarchyLevelSchema.optional(),
  company: z.nativeEnum(Company).default(Company.CENTRAL),
  status: userStatusEnum.default("ACTIVE"),
});

// ============================================
// ROLE SCHEMAS
// ============================================

export const createRoleSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(50).regex(/^[A-Z_]+$/, "Nome deve ser maiúsculo com underscores"),
  displayName: z.string().min(2, "Nome de exibição deve ter pelo menos 2 caracteres").max(100),
  hierarchyLevel: hierarchyLevelSchema,
});

export const updateRoleSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  name: z.string().min(2).max(50).regex(/^[A-Z_]+$/).optional(),
  displayName: z.string().min(2).max(100).optional(),
  hierarchyLevel: hierarchyLevelSchema.optional(),
});

export const deleteRoleSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// ============================================
// PANEL/TOOL SCHEMAS
// ============================================

export const panelCategoryEnum = z.nativeEnum(Company);

export const createPanelSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  description: z.string().max(500).optional(),
  url: z.string().url("URL inválida"),
  icon: z.string().min(1, "Ícone é obrigatório").max(50),
  category: z.string().min(1).optional().default("GERAL"),
  minRole: userRoleEnum.default("VIEWER"),
  minHierarchy: hierarchyLevelSchema.default(3),
  isActive: z.boolean().default(true),
  companySlug: z.string().nullable().optional(),
});

export const updatePanelSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  url: z.string().url().optional(),
  icon: z.string().min(1).max(50).optional(),
  category: z.string().min(1).optional(),
  minRole: userRoleEnum.optional(),
  minHierarchy: hierarchyLevelSchema.optional(),
  isActive: z.boolean().optional(),
  companySlug: z.string().nullable().optional(),
});

export const deletePanelSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// ============================================
// DOCUMENT SCHEMAS
// ============================================

export const documentTypeEnum = z.enum(["file", "link", "drive", "sharepoint", "youtube", "video"]);

export const createDocumentSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres").max(200),
  description: z.string().max(1000).optional(),
  fileUrl: z.string().url("URL do arquivo inválida"),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024 * 1024, "Tamanho máximo 10GB").optional(), // 10GB
  fileType: z.string().max(100).optional(),
  type: documentTypeEnum.default("file"),
  category: panelCategoryEnum,
  minHierarchyLevel: hierarchyLevelSchema.default(3),
});

export const updateDocumentSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional(),
  fileUrl: z.string().url().optional(),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024 * 1024).optional(),
  fileType: z.string().max(100).optional(),
  type: documentTypeEnum.optional(),
  category: panelCategoryEnum.optional(),
  minHierarchyLevel: hierarchyLevelSchema.optional(),
});

export const deleteDocumentSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// ============================================
// ANNOUNCEMENT SCHEMAS
// ============================================

export const announcementPriorityEnum = z.enum(["INFO", "WARNING", "IMPORTANT"]);

export const createAnnouncementSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres").max(200),
  content: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres").max(5000),
  priority: announcementPriorityEnum.default("INFO"),
  targetCompanies: z.string().max(500).optional(), // CSV of company codes
  expiresAt: z.string().datetime().nullable().optional(),
  isPinned: z.boolean().default(false),
});

export const updateAnnouncementSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  title: z.string().min(2).max(200).optional(),
  content: z.string().min(10).max(5000).optional(),
  priority: announcementPriorityEnum.optional(),
  targetCompanies: z.string().max(500).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isPinned: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const deleteAnnouncementSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

export const markReadSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// ============================================
// BUSINESS UNIT SCHEMAS
// ============================================

export const createBusinessUnitSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  slug: z.string().min(2, "Slug deve ter pelo menos 2 caracteres").max(100).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  company: panelCategoryEnum,
  description: z.string().max(2000).optional(),
  logo: z.string().url().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export const updateBusinessUnitSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  name: z.string().min(2).max(200).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  company: panelCategoryEnum.optional(),
  description: z.string().max(2000).optional(),
  logo: z.string().url().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const deleteBusinessUnitSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// Business Unit Tool schemas
export const createBusinessUnitToolSchema = z.object({
  businessUnitId: z.string().min(1, "Business Unit ID é obrigatório"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  description: z.string().max(500).optional(),
  url: z.string().url("URL inválida"),
  icon: z.string().min(1, "Ícone é obrigatório").max(50),
  category: z.string().min(1, "Categoria é obrigatória").max(50),
});

export const updateBusinessUnitToolSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  url: z.string().url().optional(),
  icon: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(50).optional(),
});

export const deleteBusinessUnitToolSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// Business Unit Social Link schemas
export const socialPlatformEnum = z.enum(["instagram", "facebook", "linkedin", "youtube", "tiktok", "twitter", "other"]);

export const createBusinessUnitSocialLinkSchema = z.object({
  businessUnitId: z.string().min(1, "Business Unit ID é obrigatório"),
  platform: socialPlatformEnum,
  handle: z.string().min(1, "Handle é obrigatório").max(100).optional(),
  url: z.string().url("URL inválida"),
  followersCount: z.number().int().min(0).default(0),
});

export const updateBusinessUnitSocialLinkSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  platform: socialPlatformEnum.optional(),
  handle: z.string().max(100).optional(),
  url: z.string().url().optional(),
  followersCount: z.number().int().min(0).optional(),
});

export const deleteBusinessUnitSocialLinkSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// Business Unit Analytics schemas
export const createBusinessUnitAnalyticsSchema = z.object({
  businessUnitId: z.string().min(1, "Business Unit ID é obrigatório"),
  date: z.string().date("Data inválida (YYYY-MM-DD)"),
  pageViews: z.number().int().min(0).default(0),
  uniqueVisitors: z.number().int().min(0).default(0),
  avgSessionDuration: z.number().int().min(0).default(0),
  bounceRate: z.number().min(0).max(100).default(0),
});

export const updateBusinessUnitAnalyticsSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  date: z.string().date().optional(),
  pageViews: z.number().int().min(0).optional(),
  uniqueVisitors: z.number().int().min(0).optional(),
  avgSessionDuration: z.number().int().min(0).optional(),
  bounceRate: z.number().min(0).max(100).optional(),
});

export const deleteBusinessUnitAnalyticsSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// Business Unit Meta Data schemas
export const createBusinessUnitMetaDataSchema = z.object({
  businessUnitId: z.string().min(1, "Business Unit ID é obrigatório"),
  date: z.string().date("Data inválida (YYYY-MM-DD)"),
  impressions: z.number().int().min(0).default(0),
  reach: z.number().int().min(0).default(0),
  engagement: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  ctr: z.number().min(0).max(100).default(0),
});

export const updateBusinessUnitMetaDataSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  date: z.string().date().optional(),
  impressions: z.number().int().min(0).optional(),
  reach: z.number().int().min(0).optional(),
  engagement: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  ctr: z.number().min(0).max(100).optional(),
});

export const deleteBusinessUnitMetaDataSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// Business Unit Revenue schemas
export const createBusinessUnitRevenueSchema = z.object({
  businessUnitId: z.string().min(1, "Business Unit ID é obrigatório"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Mês deve ser no formato YYYY-MM"),
  amount: z.number().positive("Valor deve ser positivo"),
  currency: z.string().length(3).default("BRL"),
});

export const updateBusinessUnitRevenueSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
});

export const deleteBusinessUnitRevenueSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// ============================================
// COMPANY CONFIG SCHEMAS
// ============================================

export const createCompanySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  slug: z.string().min(2, "Slug deve ter pelo menos 2 caracteres").max(50).regex(/^[a-z0-9-]+$/).optional(),
  color: z.string().max(50).default("AZUL"),
  holding: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  showOnHome: z.boolean().default(true),
  order: z.number().int().min(0).optional().default(0),
});

export const updateCompanySchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  color: z.string().max(50).optional(),
  holding: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  showOnHome: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const deleteCompanySchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

// ============================================
// SEARCH SCHEMAS
// ============================================

export const searchSchema = z.object({
  q: z.string().min(1, "Query de busca é obrigatória").max(200),
  type: z.enum(["all", "documents", "panels", "users", "business-units", "announcements"]).default("all"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

// ============================================
// AUDIT LOG SCHEMAS
// ============================================

export const auditLogFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  userId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================
// VALIDATION HELPER
// ============================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: Response };

export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const errorMessages = result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      ).join("; ");
      
      return {
        success: false,
        error: Response.json(
          { error: "Dados inválidos", details: errorMessages },
          { status: 400 }
        ),
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: Response.json(
          { error: "JSON inválido no corpo da requisição" },
          { status: 400 }
        ),
      };
    }
    throw error;
  }
}

export function validateParams<T>(
  params: Record<string, string | undefined>,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const result = schema.safeParse(params);
  
  if (!result.success) {
    const errorMessages = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    ).join("; ");
    
    return {
      success: false,
      error: Response.json(
        { error: "Parâmetros inválidos", details: errorMessages },
        { status: 400 }
      ),
    };
  }
  
  return { success: true, data: result.data };
}

export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const obj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  
  return validateParams(obj, schema);
}