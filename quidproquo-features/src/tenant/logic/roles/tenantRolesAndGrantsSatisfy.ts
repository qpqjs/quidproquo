import { TenantPermissionGrant } from '../../models/TenantPermissionGrant';
import { TenantPermissionRequirement } from '../../models/TenantPermissionRequirement';
import { TenantRoleCatalog } from '../../models/TenantRoleCatalog';
import { tenantPermissionGrantSatisfies } from './tenantPermissionGrantSatisfies';
import { tenantRoleCatalogExpand } from './tenantRoleCatalogExpand';

/** Would this combination of roles and direct grants satisfy the requirement? Takes the parts, so a proposed assignment can be judged before it is stored. */
export const tenantRolesAndGrantsSatisfy = (
  catalog: TenantRoleCatalog,
  roles: string[],
  grants: TenantPermissionGrant[],
  requirement: TenantPermissionRequirement,
): boolean => tenantPermissionGrantSatisfies([...tenantRoleCatalogExpand(catalog, roles), ...grants], requirement);
