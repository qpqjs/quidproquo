import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { askTenantMembershipWrite } from '../data/askTenantMembershipWrite';
import { TenantId } from '../models/TenantId';
import { TenantMembership } from '../models/TenantMembership';
import { TenantMemberUpdateRequest } from '../models/TenantMemberUpdateRequest';
import { askTenantAssertNotLastAssigner } from './askTenantAssertNotLastAssigner';

/** Change a member's per-tenant settings. The caller may not disable themself, and nobody may disable the last assigner. */
export function* askTenantMemberUpdate(
  tenantId: TenantId,
  callerUserId: string,
  userId: string,
  update: TenantMemberUpdateRequest,
): AskResponse<TenantMembership> {
  const membership = yield* askTenantMembershipGet(userId, tenantId);
  if (!membership) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `User is not a member of the tenant: ${userId}`);
  }

  const disabled = update.disabled ?? membership.disabled ?? false;

  if (disabled && userId === callerUserId) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'You cannot disable yourself.');
  }

  if (disabled && !membership.disabled) {
    yield* askTenantAssertNotLastAssigner(tenantId, userId);
  }

  const updated: TenantMembership = { ...membership, disabled };
  yield* askTenantMembershipWrite(updated);

  return updated;
}
