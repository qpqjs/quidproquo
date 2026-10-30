import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askTenantMembershipSetError } from '../actionCreators/askTenantMembershipSetError';
import { askTenantMembershipSetLoading } from '../actionCreators/askTenantMembershipSetLoading';
import { askTenantMembershipSetMembers } from '../actionCreators/askTenantMembershipSetMembers';
import { askTenantMembersFetch } from '../transport/askTenantMembersFetch';

/** Load (or reload) the roster for a management screen. */
export function* askTenantMembershipUiLoadMembers(target: TenantClientTarget, tenantId: TenantId): AskResponse<void> {
  const result = yield* askUiCatch(askTenantMembersFetch(target, tenantId), {
    askSetError: askTenantMembershipSetError,
    askSetBusy: askTenantMembershipSetLoading,
  });

  if (!result.success) {
    return;
  }

  yield* askTenantMembershipSetMembers(result.result);
}
