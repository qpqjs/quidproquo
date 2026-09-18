import { QpqPermission } from '../../permission/types/QpqPermission';
import { TenantMembership } from './TenantMembership';

/** The caller's own membership row plus every permission it expands to. What a UI builds its nav from; the server still checks. */
export type TenantCallerMembership = TenantMembership & {
  permissions: QpqPermission[];
};
