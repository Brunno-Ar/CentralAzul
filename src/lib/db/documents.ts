/**
 * Camada de dados - Documentos e Tipos de Documentos
 *
 * Responsavel por todas as operacoes relacionadas a documentos e categorias/tipos de documentos.
 */

import DOMPurify from "isomorphic-dompurify";
import { prisma } from "../db";

export const documentsDb = {
  getDocuments: async (
    userLevel?: number,
    userCompany?: string,
  ) => {
    const whereFilter =
      userLevel !== undefined && userLevel !== 1 && userCompany
        ? {
            minHierarchyLevel: { gte: userLevel },
            OR: [{ category: userCompany }, { category: "CENTRAL" }],
          }
        : userLevel !== undefined && userLevel !== 1 && !userCompany
          ? { minHierarchyLevel: { gte: userLevel } }
          : undefined;

    try {
      const dbDocs = await prisma.document.findMany({
        where: whereFilter as never,
        include: { uploadedBy: true },
        orderBy: { createdAt: "desc" },
      });
      return dbDocs.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description ? DOMPurify.sanitize(d.description) : "",
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
      console.error("Prisma error getting documents", e);
      return [];
    }
  },

  addDocument: async (
    doc: {
      title: string;
      description: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      category: string;
      minHierarchyLevel: number;
      uploadedById: string;
    }
  ) => {
    try {
      const created = await prisma.document.create({
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
      console.error("Prisma error creating document", e);
      throw e;
    }
  },

  deleteDocument: async (id: string) => {
    try {
      await prisma.document.delete({ where: { id } });
      return true;
    } catch (e) {
      console.error("Prisma error deleting document", e);
      return false;
    }
  },

  // ============================================
  // DOCUMENT TYPES (CATEGORIES) CRUD
  // ============================================
  getDocumentTypes: async () => {
    try {
      const types = await prisma.documentType.findMany({
        orderBy: { name: "asc" },
      });
      if (types.length > 0) {
        return types;
      }
      // Seed default document types if database list is empty
      const defaultTypes = [
        { name: "Contratos", icon: "FileSignature" },
        { name: "Financeiro", icon: "DollarSign" },
        { name: "Manuais", icon: "BookOpen" },
        { name: "Regulamentos", icon: "FileText" },
        { name: "Apresentações", icon: "Presentation" },
        { name: "Outros", icon: "Folder" },
      ];
      for (const t of defaultTypes) {
        await prisma.documentType.create({
          data: t,
        });
      }
      return await prisma.documentType.findMany({
        orderBy: { name: "asc" },
      });
    } catch (e) {
      console.error("Prisma error getting document types", e);
      return [];
    }
  },

  createDocumentType: async (type: { name: string; icon: string }) => {
    try {
      return await prisma.documentType.create({
        data: {
          name: type.name,
          icon: type.icon,
        },
      });
    } catch (e) {
      console.error("Prisma error creating document type", e);
      throw e;
    }
  },

  updateDocumentType: async (id: string, updates: { name?: string; icon?: string }) => {
    try {
      return await prisma.documentType.update({
        where: { id },
        data: updates,
      });
    } catch (e) {
      console.error("Prisma error updating document type", e);
      throw e;
    }
  },

  deleteDocumentType: async (id: string) => {
    try {
      await prisma.documentType.delete({ where: { id } });
      return true;
    } catch (e) {
      console.error("Prisma error deleting document type", e);
      return false;
    }
  },
};
