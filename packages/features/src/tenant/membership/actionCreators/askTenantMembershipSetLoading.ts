import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { TenantMembershipUiEffect } from '../effects/TenantMembershipUiEffect';
import { TenantMembershipUiSetLoadingEffect } from '../effects/TenantMembershipUiSetLoadingEffect';

/** Marks a fetch in flight. */
export function* askTenantMembershipSetLoading(isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<TenantMembershipUiSetLoadingEffect>(TenantMembershipUiEffect.SetLoading, { isLoading });
}
