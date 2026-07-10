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
