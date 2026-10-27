import { askCatch, AskResponse } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askUITenantMembershipSetError } from '../actionCreators/askUITenantMembershipSetError';
import { askUITenantMembershipSetLoading } from '../actionCreators/askUITenantMembershipSetLoading';
import { askUITenantMembershipSetMembers } from '../actionCreators/askUITenantMembershipSetMembers';
import { askTenantMembersFetch } from '../transport/askTenantMembersFetch';

/** Load (or reload) the roster for a management screen. */
export function* askTenantMembershipUiLoadMembers(target: TenantClientTarget, tenantId: TenantId): AskResponse<void> {
  yield* askUITenantMembershipSetLoading(true);
  yield* askUITenantMembershipSetError(null);

  const result = yield* askCatch(askTenantMembersFetch(target, tenantId), askUITenantMembershipSetLoading(false));

  if (!result.success) {
    yield* askUITenantMembershipSetError(result.error.errorText);
    return;
  }

  yield* askUITenantMembershipSetMembers(result.result);
}
