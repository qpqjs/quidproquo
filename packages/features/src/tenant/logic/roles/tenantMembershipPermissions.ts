import { QpqPermission } from '../../../permission/types/QpqPermission';
import { TenantMembership } from '../../models/TenantMembership';
import { TenantRoleCatalog } from '../../models/TenantRoleCatalog';
import { tenantMembershipEffectiveGrants } from './tenantMembershipEffectiveGrants';

/** Every permission key a membership holds at any scope, for a UI deciding what to offer. Not a check: use tenantMembershipSatisfies for that. */
export const tenantMembershipPermissions = (catalog: TenantRoleCatalog, membership: TenantMembership): QpqPermission[] => [
  ...new Set(tenantMembershipEffectiveGrants(catalog, membership).map((grant) => grant.permission)),
];
