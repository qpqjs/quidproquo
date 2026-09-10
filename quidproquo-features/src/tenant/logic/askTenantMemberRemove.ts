import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askTenantResolveOwnerUserId } from './askTenantResolveOwnerUserId';
import { askTenantUnlinkMember } from './askTenantUnlinkMember';

// Remove a member from a tenant. The owner can never be removed (by anyone): it
// would orphan the tenant - nothing but a membership link can find it again - and
// ownership is what gates member management in the first place.
export function* askTenantMemberRemove(tenantId: string, userId: string): AskResponse<void> {
  const ownerUserId = yield* askTenantResolveOwnerUserId(tenantId);
  if (userId === ownerUserId) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, "The tenant's owner cannot be removed.");
  }

  yield* askTenantUnlinkMember(tenantId, userId);
}
