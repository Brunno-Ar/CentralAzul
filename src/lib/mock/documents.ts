import { Company } from "@prisma/client";
import type { MockDocument } from "../db";

export const mockDocuments: MockDocument[] = globalThis.__mockDocuments ?? (globalThis.__mockDocuments = [
  {
    id: "doc-1",
    title: "Documento Exemplo",
    description: "Descricao do documento exemplo",
    fileUrl: "https://example.com/doc1.pdf",
    fileSize: 1024,
    fileType: "application/pdf",
    category: Company.CENTRAL,
    minHierarchyLevel: 1,
    uploadedById: "user-central-admin",
    uploadedByName: "Administrador Central",
    createdAt: new Date(),
  },
]);
