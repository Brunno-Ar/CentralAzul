import type { MockAnnouncement, MockAnnouncementRead } from "../db";

export const mockAnnouncements: MockAnnouncement[] = globalThis.__mockAnnouncements ?? (globalThis.__mockAnnouncements = [
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

export const mockAnnouncementReads: MockAnnouncementRead[] = globalThis.__mockAnnouncementReads ?? (globalThis.__mockAnnouncementReads = []);
