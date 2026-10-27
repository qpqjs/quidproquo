import { AskResponse } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { TenantMembership } from '../../models/TenantMembership';
import { TenantMemberUpdateRequest } from '../../models/TenantMemberUpdateRequest';
import { askTenantApiRequest } from './askTenantApiRequest';

/** PATCH myTenants/{id}/members/{userId}: disable or re-enable a member. */
export function* askTenantMemberDisabledPatch(
  target: TenantClientTarget,
  tenantId: TenantId,
  userId: string,
  disabled: boolean,
): AskResponse<TenantMembership> {
  return yield* askTenantApiRequest<TenantMemberUpdateRequest, TenantMembership>(target, 'PATCH', `/${tenantId}/members/${userId}`, { disabled });
}
