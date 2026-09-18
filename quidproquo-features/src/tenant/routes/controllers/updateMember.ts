import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askEventDocParseBody } from '../../../eventDoc/routes/askEventDocParseBody';
import { askTenantMemberUpdate } from '../../logic/askTenantMemberUpdate';
import { TenantMemberUpdateRequest } from '../../models/TenantMemberUpdateRequest';
import { askTenantAssertCallerMayManageMembers } from '../askTenantAssertCallerMayManageMembers';

/** PATCH {basePath}/{id}/members/{userId}: change a member's disabled flag (body `{ disabled? }`). Needs MembersManage. */
export function* updateMember(event: HTTPEvent, params: { id: string; userId: string }): AskResponse<HTTPEventResponse> {
  const callerUserId = yield* askEventDocResolveUserId();
  yield* askTenantAssertCallerMayManageMembers(params.id, callerUserId);

  const body = yield* askEventDocParseBody<TenantMemberUpdateRequest>(event);

  if (body.disabled !== undefined && typeof body.disabled !== 'boolean') {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'disabled must be a boolean');
  }

  const membership = yield* askTenantMemberUpdate(params.id, callerUserId, params.userId, { disabled: body.disabled });

  return qpqWebServerUtils.toJsonEventResponse(membership);
}
