import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantIdParse } from '../../logic/askTenantIdParse';
import { askTenantMemberRemove } from '../../logic/askTenantMemberRemove';
import { askTenantAssertCallerMayManageMembers } from '../askTenantAssertCallerMayManageMembers';

/**
 * DELETE {basePath}/{id}/members/{userId}: remove a member. Needs MembersManage, except that
 * anyone may remove themself (leave). The last assigner is never removed either way.
 */
export function* removeMember(event: HTTPEvent, params: { id: string; userId: string }): AskResponse<HTTPEventResponse> {
  const tenantId = yield* askTenantIdParse(params.id);
  const callerUserId = yield* askEventDocResolveUserId();

  if (callerUserId !== params.userId) {
    yield* askTenantAssertCallerMayManageMembers(tenantId, callerUserId);
  }

  yield* askTenantMemberRemove(tenantId, params.userId);

  return qpqWebServerUtils.toJsonEventResponse({ ok: true });
}
