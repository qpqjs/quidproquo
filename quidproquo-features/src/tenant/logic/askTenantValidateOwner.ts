import { AskResponse } from 'quidproquo-core';

import { askTenantResolveOwnerUserId } from './askTenantResolveOwnerUserId';

// Whether the user OWNS (created) the tenant - the only role there is: owners manage
// membership; members merely belong.
export function* askTenantValidateOwner(userId: string, tenantId: string): AskResponse<boolean> {
  const ownerUserId = yield* askTenantResolveOwnerUserId(tenantId);
  return ownerUserId !== null && ownerUserId === userId;
}
