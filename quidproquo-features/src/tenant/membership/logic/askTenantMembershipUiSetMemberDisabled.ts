import { askCatch, AskResponse } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askUITenantMembershipSetError } from '../actionCreators/askUITenantMembershipSetError';
import { askTenantMemberDisabledPatch } from '../transport/askTenantMemberDisabledPatch';
import { askTenantMembershipUiLoadMembers } from './askTenantMembershipUiLoadMembers';

/** Disable or re-enable a member. Reloads the roster on success; a refusal lands in `error` and the roster is left as it was. Returns whether it succeeded. */
export function* askTenantMembershipUiSetMemberDisabled(
  target: TenantClientTarget,
  tenantId: TenantId,
  userId: string,
  disabled: boolean,
): AskResponse<boolean> {
  yield* askUITenantMembershipSetError(null);

  const result = yield* askCatch(askTenantMemberDisabledPatch(target, tenantId, userId, disabled));

  if (!result.success) {
    yield* askUITenantMembershipSetError(result.error.errorText);
    return false;
  }

  yield* askTenantMembershipUiLoadMembers(target, tenantId);
  return true;
}
