import type { MockDocument } from "../db";

export const mockDocuments: MockDocument[] = globalThis.__mockDocuments ?? (globalThis.__mockDocuments = [
  {
    id: "doc-1",
    title: "Diretrizes de Seguranca da Informacao 2026",
    description:
      "Manual de politicas de acesso, senhas e conformidade digital do Grupo Azul.",
    fileUrl: "#",
    fileSize: 2450000,
    fileType: "application/pdf",
    category: "CENTRAL",
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
    category: "BORGO",
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
    category: "MAPLE_BEAR",
    minHierarchyLevel: 3,
    uploadedById: "user-maple",
    uploadedByName: "Coordenador Maple Bear",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
]);
