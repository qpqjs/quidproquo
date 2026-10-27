import { Nullable } from 'quidproquo-core';

import { TenantMembership } from '../../models/TenantMembership';
import { TenantPermissionRequirement } from '../../models/TenantPermissionRequirement';
import { TenantRoleCatalog } from '../../models/TenantRoleCatalog';
import { tenantRolesAndGrantsSatisfy } from './tenantRolesAndGrantsSatisfy';

/** Does this membership row hold the requirement? No row, or a disabled one, holds nothing. */
export const tenantMembershipSatisfies = (
  catalog: TenantRoleCatalog,
  membership: Nullable<TenantMembership>,
  requirement: TenantPermissionRequirement,
): boolean => !!membership && !membership.disabled && tenantRolesAndGrantsSatisfy(catalog, membership.roles, membership.grants, requirement);
