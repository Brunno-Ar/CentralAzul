/**
 * Canonical Company type shared across the application.
 *
 * This interface is the single source of truth for the "Company / Empresa"
 * entity used by hooks (useCompanies), client components (EmpresasClient,
 * FerramentasClient) and the mock/fallback data layer (db.ts).
 *
 * `createdAt` and `updatedAt` are optional because the client-facing API
 * payloads do not always include them, while the database/mock layer does.
 */
export interface Company {
  id: string;
  name: string;
  slug: string;
  /** Brand color key (e.g. "GOLD", "WINE", "RED", "AZUL"). Nullable for legacy rows. */
  color: string | null;
  /** Optional holding/group this company belongs to. */
  holding: string | null;
  isActive: boolean;
  showOnHome: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Minimal projection of a Company used by tool/level configuration screens that
 * only need id/slug/name/color. Prefer using `Pick<Company, ...>` instead, but
 * this alias is kept for readability in component prop types.
 */
export type CompanyConfig = Pick<Company, "id" | "name" | "slug" | "color">;
