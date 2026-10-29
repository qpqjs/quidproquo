import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askUITenantMembershipSetError } from '../actionCreators/askUITenantMembershipSetError';
import { askTenantMemberAddPost } from '../transport/askTenantMemberAddPost';
import { askTenantMembershipUiLoadMembers } from './askTenantMembershipUiLoadMembers';

/** Add an existing account by email. Reloads the roster on success; a refusal lands in `error` and the roster is left as it was. Returns whether it succeeded. */
export function* askTenantMembershipUiAddMember(target: TenantClientTarget, tenantId: TenantId, email: string): AskResponse<boolean> {
  const result = yield* askUiCatch(askTenantMemberAddPost(target, tenantId, email), { askSetError: askUITenantMembershipSetError });

  if (!result.success) {
    return false;
  }

  yield* askTenantMembershipUiLoadMembers(target, tenantId);
  return true;
}
