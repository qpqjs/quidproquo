import { AskResponse } from 'quidproquo-core';

import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { TenantMembershipRole } from '../models/TenantMembershipRole';

// Whether the user is an ENABLED owner of the tenant - the role that manages
// membership (add / remove / update members). Ownership is a role on the
// membership row, so a tenant may have several owners.
export function* askTenantValidateOwner(userId: string, tenantId: string): AskResponse<boolean> {
  const membership = yield* askTenantMembershipGet(userId, tenantId);
  return membership !== null && !membership.disabled && membership.role === TenantMembershipRole.owner;
}
