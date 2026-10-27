import { askCatch, AskResponse } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askUITenantMembershipSetError } from '../actionCreators/askUITenantMembershipSetError';
import { askTenantMemberRemoveDelete } from '../transport/askTenantMemberRemoveDelete';
import { askTenantMembershipUiLoadMembers } from './askTenantMembershipUiLoadMembers';

/** Remove a member. Reloads the roster on success; a refusal lands in `error` and the roster is left as it was. Returns whether it succeeded. */
export function* askTenantMembershipUiRemoveMember(target: TenantClientTarget, tenantId: TenantId, userId: string): AskResponse<boolean> {
  yield* askUITenantMembershipSetError(null);

  const result = yield* askCatch(askTenantMemberRemoveDelete(target, tenantId, userId));

  if (!result.success) {
    yield* askUITenantMembershipSetError(result.error.errorText);
    return false;
  }

  yield* askTenantMembershipUiLoadMembers(target, tenantId);
  return true;
}
