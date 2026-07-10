/**
 * Mock Data - Central de exportacoes
 *
 * Este arquivo centraliza as exportacoes de todos os dados simulados.
 * Os dados sao persistidos via globalThis para sobreviver a hot reloads.
 */

export { mockUsers, mockMfaUsers } from "./users";
export { mockRoles } from "./roles";
export { mockPanels } from "./panels";
export { mockDocuments } from "./documents";
export { mockLogs } from "./analytics";
export { mockBusinessUnits } from "./business-units";
export { mockLevels, mockMenuPermissions } from "./permissions";
export { mockCompanies } from "../db";
export { mockAnnouncements, mockAnnouncementReads } from "./announcements";
