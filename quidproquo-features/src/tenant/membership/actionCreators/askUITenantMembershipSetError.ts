import { AskResponse, askStateDispatchEffect, Nullable } from 'quidproquo-core';

import { TenantMembershipUiEffect } from '../effects/TenantMembershipUiEffect';
import { TenantMembershipUiSetErrorEffect } from '../effects/TenantMembershipUiSetErrorEffect';

/** Records or clears the last failure. */
export function* askUITenantMembershipSetError(error: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<TenantMembershipUiSetErrorEffect>(TenantMembershipUiEffect.SetError, { error });
}
