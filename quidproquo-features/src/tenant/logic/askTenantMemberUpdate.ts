import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { askTenantMembershipWrite } from '../data/askTenantMembershipWrite';
import { TenantMembership } from '../models/TenantMembership';
import { TenantMembershipRole } from '../models/TenantMembershipRole';
import { TenantMemberUpdateRequest } from '../models/TenantMemberUpdateRequest';

// Change a member's per-tenant settings (role, disabled). The caller (an owner) may
// not demote or disable themself - that could leave the tenant with no one able to
// manage it. Omitted fields keep their value.
export function* askTenantMemberUpdate(
  tenantId: string,
  callerUserId: string,
  userId: string,
  update: TenantMemberUpdateRequest,
): AskResponse<TenantMembership> {
  const membership = yield* askTenantMembershipGet(userId, tenantId);
  if (!membership) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `User is not a member of the tenant: ${userId}`);
  }

  const role = update.role ?? membership.role;
  const disabled = update.disabled ?? membership.disabled ?? false;

  if (userId === callerUserId && (role !== TenantMembershipRole.owner || disabled)) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'You cannot demote or disable yourself.');
  }

  const updated: TenantMembership = { ...membership, role, disabled };
  yield* askTenantMembershipWrite(updated);

  return updated;
}
