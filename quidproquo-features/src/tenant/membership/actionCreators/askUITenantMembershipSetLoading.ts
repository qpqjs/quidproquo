import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { TenantMembershipUiEffect } from '../effects/TenantMembershipUiEffect';
import { TenantMembershipUiSetLoadingEffect } from '../effects/TenantMembershipUiSetLoadingEffect';

/** Marks a fetch in flight. */
export function* askUITenantMembershipSetLoading(isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<TenantMembershipUiSetLoadingEffect>(TenantMembershipUiEffect.SetLoading, { isLoading });
}
