import { TenantMembership } from '../../models/TenantMembership';
import { TenantPermissionGrant } from '../../models/TenantPermissionGrant';
import { TenantRoleCatalog } from '../../models/TenantRoleCatalog';
import { tenantRoleCatalogExpand } from './tenantRoleCatalogExpand';

/** Everything a membership holds as grants: its roles expanded through the catalog plus its direct grants. What a client needs to run the same check as the server. */
export const tenantMembershipEffectiveGrants = (catalog: TenantRoleCatalog, membership: TenantMembership): TenantPermissionGrant[] => [
  ...tenantRoleCatalogExpand(catalog, membership.roles),
  ...membership.grants,
];
