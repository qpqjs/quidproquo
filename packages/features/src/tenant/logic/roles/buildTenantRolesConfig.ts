import { TENANT_ADMIN_ROLE } from '../../constants/tenantAdminRole';
import { TenantPermission } from '../../constants/TenantPermission';
import { TenantRolesConfig } from '../../models/TenantRolesConfig';
import { TenantRolesOptions } from '../../types/TenantRolesOptions';
import { buildTenantPermissionRequirement } from './buildTenantPermissionRequirement';
import { buildTenantRoleCatalog } from './buildTenantRoleCatalog';
import { tenantRoleCatalogUnknownRoles } from './tenantRoleCatalogUnknownRoles';
import { tenantRolesAndGrantsSatisfy } from './tenantRolesAndGrantsSatisfy';

/**
 * Resolve the `roles` option into what the services publish. Throws at config time when a
 * creator role is not in the catalog, or when none of them can assign roles: a tenant born
 * without an assigner can never be administered.
 */
export const buildTenantRolesConfig = (options: TenantRolesOptions = {}): TenantRolesConfig => {
  const catalog = buildTenantRoleCatalog(options.catalog);
  const creatorRoles = options.creatorRoles ?? [TENANT_ADMIN_ROLE];

  const unknown = tenantRoleCatalogUnknownRoles(catalog, creatorRoles);
  if (unknown.length > 0) {
    throw new Error(`creatorRoles names role(s) not in the catalog: ${unknown.join(', ')}`);
  }

  if (!tenantRolesAndGrantsSatisfy(catalog, creatorRoles, [], buildTenantPermissionRequirement(TenantPermission.RolesAssign))) {
    throw new Error(
      `creatorRoles must include a role holding ${TenantPermission.RolesAssign} (e.g. '${TENANT_ADMIN_ROLE}'), or no tenant could ever be administered.`,
    );
  }

  return { catalog, creatorRoles };
};
