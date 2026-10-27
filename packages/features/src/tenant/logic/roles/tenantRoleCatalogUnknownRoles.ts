import { TenantRoleCatalog } from '../../models/TenantRoleCatalog';

/** The stored codes the catalog no longer names. They grant nothing, silently, so callers log or reject them. */
export const tenantRoleCatalogUnknownRoles = (catalog: TenantRoleCatalog, roles: string[]): string[] => roles.filter((role) => !catalog[role]);
