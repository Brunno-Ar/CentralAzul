/**
 * Tool-to-Panel synchronization layer.
 *
 * Bridges BusinessUnitTool CRUD operations into SystemPanel so the
 * global "Ferramentas" tab stays 100% in sync with tools created,
 * edited, or deleted inside business units.
 *
 * Strategy: write-propagation at the API layer.  Each time a
 * BusinessUnitTool is created/updated/deleted the corresponding
 * SystemPanel row is mirrored using a correlation key
 * (SystemPanel.businessUnitToolId).
 */

import { db } from "@/lib/db";

/** Fields shared between BusinessUnitTool and SystemPanel. */
interface SyncableToolFields {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  description: string | null;
  category: string;
  isActive: boolean;
}

/** Minimal business-unit context needed for the mapping. */
interface BusinessUnitContext {
  id: string;
  slug: string;
  company: string;
}

/**
 * Map a BusinessUnitTool + its parent unit into the field set
 * required by SystemPanel / db.createPanel.
 *
 * Field mapping:
 * - name        -> name
 * - url         -> url
 * - icon        -> icon (fallback to "ShieldAlert")
 * - description -> description (fallback to empty string)
 * - category    -> business unit's Company enum value (BORGO | MAPLE_BEAR | AZUL | CENTRAL)
 * - companySlug -> business unit's slug
 * - minRole     -> "VIEWER" (default; tools are accessible to all authenticated users)
 * - minHierarchy-> 3       (default; locked only for the lowest hierarchy level)
 * - isActive    -> tool.isActive
 */
function toolToPanelFields(
  tool: SyncableToolFields,
  unit: BusinessUnitContext,
) {
  return {
    name: tool.name,
    description: tool.description || "",
    url: tool.url,
    icon: tool.icon || "ShieldAlert",
    category: unit.company,
    minRole: "VIEWER",
    minHierarchy: 3,
    isActive: tool.isActive,
    companySlug: unit.slug,
    businessUnitToolId: tool.id,
  };
}

/**
 * Synchronize a newly created BusinessUnitTool into SystemPanel.
 *
 * Called from the items API route after `db.addBusinessUnitTool`
 * succeeds.  If a SystemPanel with the same `businessUnitToolId`
 * already exists (e.g. from a previous run) the creation is skipped
 * to avoid duplicates.
 *
 * @returns the created SystemPanel or null on failure / duplicate.
 */
export async function syncToolToPanel(
  tool: SyncableToolFields,
  unit: BusinessUnitContext,
) {
  try {
    const existing = await db.getPanelByBusinessUnitToolId(tool.id);
    if (existing) {
      // Already synced - update instead of creating a duplicate.
      return await db.updatePanel(existing.id, toolToPanelFields(tool, unit));
    }
    return await db.createPanel(toolToPanelFields(tool, unit));
  } catch (error) {
    console.error(
      "[tool-sync] Falha ao sincronizar criacao de ferramenta:",
      error,
    );
    return null;
  }
}

/**
 * Synchronize an update to a BusinessUnitTool into its corresponding
 * SystemPanel.
 *
 * Called from the items API route after `db.updateBusinessUnitTool`
 * succeeds.  Only the provided fields are propagated; the correlation
 * key (`businessUnitToolId`) is preserved.
 *
 * @returns the updated SystemPanel or null if not found / on failure.
 */
export async function syncToolUpdateToPanel(
  toolId: string,
  updates: {
    name?: string;
    url?: string;
    icon?: string | null;
    description?: string | null;
    category?: string;
    isActive?: boolean;
  },
  unit: BusinessUnitContext,
) {
  try {
    const existing = await db.getPanelByBusinessUnitToolId(toolId);
    if (!existing) {
      // No synced panel yet - create one from the update payload.
      // We need the full tool; fetch it from the unit to get stable data.
      const fullTool = await db.getBusinessUnitToolById(toolId, unit.id);
      if (fullTool) {
        return await db.createPanel(
          toolToPanelFields(
            {
              id: fullTool.id,
              name: fullTool.name,
              url: fullTool.url,
              icon: fullTool.icon,
              description: fullTool.description,
              category: fullTool.category,
              isActive: fullTool.isActive,
            },
            unit,
          ),
        );
      }
      return null;
    }

    const panelUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) panelUpdates.name = updates.name;
    if (updates.url !== undefined) panelUpdates.url = updates.url;
    if (updates.icon !== undefined) panelUpdates.icon = updates.icon;
    if (updates.description !== undefined)
      panelUpdates.description = updates.description;
    // When the business unit's company changes the category is remapped;
    // otherwise keep the tool-level category if provided.
    if (updates.category !== undefined)
      panelUpdates.category = unit.company;
    if (updates.isActive !== undefined)
      panelUpdates.isActive = updates.isActive;

    // Keep companySlug in sync with the unit slug.
    panelUpdates.companySlug = unit.slug;

    return await db.updatePanel(existing.id, panelUpdates);
  } catch (error) {
    console.error(
      "[tool-sync] Falha ao sincronizar edicao de ferramenta:",
      error,
    );
    return null;
  }
}

/**
 * Synchronize the deletion of a BusinessUnitTool into its
 * corresponding SystemPanel.
 *
 * Called from the items API route after `db.deleteBusinessUnitTool`
 * succeeds.  Looks up the SystemPanel by `businessUnitToolId` and
 * deletes it.
 *
 * @returns true if the panel was deleted (or never existed); false on failure.
 */
export async function syncToolDeleteFromPanel(toolId: string): Promise<boolean> {
  try {
    const existing = await db.getPanelByBusinessUnitToolId(toolId);
    if (!existing) {
      // Nothing to delete - treat as success.
      return true;
    }
    return await db.deletePanel(existing.id);
  } catch (error) {
    console.error(
      "[tool-sync] Falha ao sincronizar remocao de ferramenta:",
      error,
    );
    return false;
  }
}
