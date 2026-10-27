import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { TenantMembershipUiEffect } from '../effects/TenantMembershipUiEffect';
import { TenantMembershipUiResetEffect } from '../effects/TenantMembershipUiResetEffect';

/** Clears everything (tenant deselected). */
export function* askUITenantMembershipReset(): AskResponse<void> {
  yield* askStateDispatchEffect<TenantMembershipUiResetEffect>(TenantMembershipUiEffect.Reset, undefined);
}
