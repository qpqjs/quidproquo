import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantMemberRemove } from '../../logic/askTenantMemberRemove';
import { askTenantAssertCallerMayManageMembers } from '../askTenantAssertCallerMayManageMembers';

/** DELETE {basePath}/{id}/members/{userId}: remove a member. Needs MembersManage. The last assigner is never removed. */
export function* removeMember(event: HTTPEvent, params: { id: string; userId: string }): AskResponse<HTTPEventResponse> {
  const callerUserId = yield* askEventDocResolveUserId();
  yield* askTenantAssertCallerMayManageMembers(params.id, callerUserId);

  yield* askTenantMemberRemove(params.id, params.userId);

  return qpqWebServerUtils.toJsonEventResponse({ ok: true });
}
