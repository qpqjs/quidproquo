import { AskResponse } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askTenantApiRequest } from './askTenantApiRequest';

/** DELETE myTenants/{id}/members/{userId}: remove a member (or leave, when it is the caller). */
export function* askTenantMemberRemoveDelete(target: TenantClientTarget, tenantId: TenantId, userId: string): AskResponse<void> {
  yield* askTenantApiRequest<void, { ok: boolean }>(target, 'DELETE', `/${tenantId}/members/${userId}`);
}
