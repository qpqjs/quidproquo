import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askUITenantMembershipSetError } from '../actionCreators/askUITenantMembershipSetError';
import { askUITenantMembershipSetLoading } from '../actionCreators/askUITenantMembershipSetLoading';
import { askUITenantMembershipSetMembers } from '../actionCreators/askUITenantMembershipSetMembers';
import { askTenantMembersFetch } from '../transport/askTenantMembersFetch';

/** Load (or reload) the roster for a management screen. */
export function* askTenantMembershipUiLoadMembers(target: TenantClientTarget, tenantId: TenantId): AskResponse<void> {
  const result = yield* askUiCatch(askTenantMembersFetch(target, tenantId), {
    askSetError: askUITenantMembershipSetError,
    askSetBusy: askUITenantMembershipSetLoading,
  });

  if (!result.success) {
    return;
  }

  yield* askUITenantMembershipSetMembers(result.result);
}
