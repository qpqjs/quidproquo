import { QpqPermission } from '../../../permission/types/QpqPermission';
import { TenantMembership } from '../../models/TenantMembership';
import { TenantRoleCatalog } from '../../models/TenantRoleCatalog';
import { tenantRoleCatalogExpand } from './tenantRoleCatalogExpand';

/** Every permission key a membership holds at any scope, for a UI deciding what to offer. Not a check: use tenantMembershipSatisfies for that. */
export const tenantMembershipPermissions = (catalog: TenantRoleCatalog, membership: TenantMembership): QpqPermission[] => {
  const held = new Set<QpqPermission>();

  for (const grant of [...tenantRoleCatalogExpand(catalog, membership.roles), ...membership.grants]) {
    held.add(grant.permission);
  }

  return [...held];
};
