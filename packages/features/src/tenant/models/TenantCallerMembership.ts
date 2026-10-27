import { QpqPermission } from '../../permission/types/QpqPermission';
import { TenantMembership } from './TenantMembership';
import { TenantPermissionGrant } from './TenantPermissionGrant';

/**
 * The caller's own membership row plus what it expands to: `permissions` is the flat key list a
 * nav filters on, `effectiveGrants` (roles expanded plus direct grants) lets a client run the
 * same resource-scoped check as the server. The server still checks; a client only hides.
 */
export type TenantCallerMembership = TenantMembership & {
  permissions: QpqPermission[];
  effectiveGrants: TenantPermissionGrant[];
};
