/**
 * Camada de dados - Auth Defaults
 */

import { getSystemConfig } from "../db";

export async function getAuthDefaults() {
  const [defaultRole, defaultHierarchyLevel, defaultCompany, defaultUserStatus] = await Promise.all([
    getSystemConfig("defaultRole"),
    getSystemConfig("defaultHierarchyLevel"),
    getSystemConfig("defaultCompany"),
    getSystemConfig("defaultUserStatus")
  ]);

  return {
    defaultRole: defaultRole || "VIEWER",
    defaultHierarchyLevel: parseInt(defaultHierarchyLevel || "3", 10),
    defaultCompany: defaultCompany || "CENTRAL",
    defaultUserStatus: defaultUserStatus || "ACTIVE",
    sessionMaxAge: parseInt((await getSystemConfig("sessionMaxAge")) || "86400", 10)
  };
}
