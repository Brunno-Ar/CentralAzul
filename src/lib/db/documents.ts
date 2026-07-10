/**
 * Camada de dados - Documentos
 *
 * Responsavel por todas as operacoes relacionadas a documentos:
 * - getDocuments
 * - addDocument
 * - deleteDocument
 */

import DOMPurify from "isomorphic-dompurify";
import type { MockDocument } from "../db";
import { prisma, isDatabaseConnected, mockDocuments, mockUsers } from "../db";

export type { MockDocument };

export const documentsDb = {
  getDocuments: async (
    userLevel?: number,
    userCompany?: string,
  ) => {
    // Applicative RLS via Prisma where clause.
    // Level 1 (Direcao Geral) sees ALL docs.
    // Level 2+ sees only docs where minHierarchyLevel >= userLevel
    //   AND (category == userCompany OR category == CENTRAL).
    const whereFilter =
      userLevel !== undefined && userLevel !== 1 && userCompany
        ? {
            minHierarchyLevel: { gte: userLevel },
            OR: [{ category: userCompany }, { category: "CENTRAL" }],
          }
        : userLevel !== undefined && userLevel !== 1 && !userCompany
          ? { minHierarchyLevel: { gte: userLevel } }
          : undefined;

    if (prisma && isDatabaseConnected()) {
      try {
        const dbDocs = await prisma.document.findMany({
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
            doc.category === "CENTRAL"),
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
    if (prisma && isDatabaseConnected()) {
      try {
        // Ensure user exists in db first
        let dbUser = await prisma.user.findUnique({
          where: { id: doc.uploadedById },
        });
        if (!dbUser) {
          const user = mockUsers.find((u) => u.id === doc.uploadedById);
          if (user) {
            dbUser = await prisma.user.create({
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
        console.error("Prisma error creating document, falling back", e);
      }
    }
    mockDocuments.unshift(newDoc);
    return newDoc;
  },

  deleteDocument: async (id: string) => {
    if (prisma && isDatabaseConnected()) {
      try {
        await prisma.document.delete({ where: { id } });
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
};
