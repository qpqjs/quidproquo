import { TenantPermissionGrant } from '../../models/TenantPermissionGrant';
import { TenantPermissionRequirement } from '../../models/TenantPermissionRequirement';
import { TenantPermissionSelector } from '../../models/TenantPermissionSelector';

// An operation with no resource is satisfiable only by `all`: an ids list cannot contain
// "no id", and letting '' match would let a resource-scoped grant reach tenant-wide routes.
const selectorAllows = (selector: TenantPermissionSelector, requirement: TenantPermissionRequirement): boolean => {
  if (selector.kind === 'all') {
    return true;
  }

  if (requirement.resourceId === '') {
    return false;
  }

  if (selector.kind === 'ids') {
    return selector.ids.includes(requirement.resourceId);
  }

  return !!requirement.resourceKind && selector.kinds.includes(requirement.resourceKind);
};

/** The single decision point: does any grant cover the requirement? An unknown permission matches nothing, so deny is the default by construction. */
export const tenantPermissionGrantSatisfies = (grants: TenantPermissionGrant[], requirement: TenantPermissionRequirement): boolean =>
  grants.some((grant) => grant.permission === requirement.permission && selectorAllows(grant.selector, requirement));
