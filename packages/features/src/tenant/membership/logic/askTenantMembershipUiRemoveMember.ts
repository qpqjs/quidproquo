import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askTenantMembershipSetError } from '../actionCreators/askTenantMembershipSetError';
import { askTenantMemberRemoveDelete } from '../transport/askTenantMemberRemoveDelete';
import { askTenantMembershipUiLoadMembers } from './askTenantMembershipUiLoadMembers';

/** Remove a member. Reloads the roster on success; a refusal lands in `error` and the roster is left as it was. Returns whether it succeeded. */
export function* askTenantMembershipUiRemoveMember(target: TenantClientTarget, tenantId: TenantId, userId: string): AskResponse<boolean> {
  const result = yield* askUiCatch(askTenantMemberRemoveDelete(target, tenantId, userId), { askSetError: askTenantMembershipSetError });

  if (!result.success) {
    return false;
  }

  yield* askTenantMembershipUiLoadMembers(target, tenantId);
  return true;
}
