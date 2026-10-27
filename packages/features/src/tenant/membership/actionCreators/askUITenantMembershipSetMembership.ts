import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { TenantCallerMembership } from '../../models/TenantCallerMembership';
import { TenantId } from '../../models/TenantId';
import { TenantMembershipUiEffect } from '../effects/TenantMembershipUiEffect';
import { TenantMembershipUiSetMembershipEffect } from '../effects/TenantMembershipUiSetMembershipEffect';

/** Stores the caller's standing in the selected tenant. */
export function* askUITenantMembershipSetMembership(tenantId: TenantId, membership: TenantCallerMembership): AskResponse<void> {
  yield* askStateDispatchEffect<TenantMembershipUiSetMembershipEffect>(TenantMembershipUiEffect.SetMembership, { tenantId, membership });
}
