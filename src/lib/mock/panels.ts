import type { MockSystemPanel } from "../db";

export const mockPanels: MockSystemPanel[] = globalThis.__mockPanels ?? (globalThis.__mockPanels = [
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
    companySlug: null,
  },
]);
